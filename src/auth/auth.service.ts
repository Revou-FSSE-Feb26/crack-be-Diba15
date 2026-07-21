import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { Role } from '../generated/prisma/enums.js';
import { MailService } from '../mail/mail.service.js';
import { SessionRepository } from '../session/session.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { PasswordResetRepository } from './password-reset.repository.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, userAgent?: string) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email sudah terdaftar.');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.createWithProfile({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role as unknown as Role,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken, userAgent);

    return tokens;
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email atau password salah.');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Email atau password salah.');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.createSession(user.id, tokens.refreshToken, userAgent);

    return tokens;
  }

  // ─── Refresh ────────────────────────────────────────────────────────────────

  async refresh(userId: string, refreshToken: string) {
    const sessions = await this.sessionRepository.findSessionsByUserId(userId);
    if (!sessions || sessions.length === 0) {
      throw new ForbiddenException('Akses ditolak.');
    }

    let activeSession: any = null;
    for (const s of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, s.refreshToken);
      if (isMatch) {
        activeSession = s;
        break;
      }
    }

    if (!activeSession) {
      throw new ForbiddenException('Refresh token tidak valid.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new ForbiddenException('User tidak ditemukan.');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const newHashedToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.sessionRepository.updateSessionToken(activeSession.id, newHashedToken);

    return tokens;
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    try {
      const decoded = this.jwtService.decode(refreshToken) as { sub?: string };
      if (decoded?.sub) {
        const sessions = await this.sessionRepository.findSessionsByUserId(decoded.sub);
        for (const s of sessions) {
          const isMatch = await bcrypt.compare(refreshToken, s.refreshToken);
          if (isMatch) {
            await this.sessionRepository.deleteSession(s.id);
            break;
          }
        }
      }
    } catch {
      // Abaikan error penafsiran token agar logout di browser tetap sukses bersihkan cookie
    }
  }

  // ─── Forgot Password ────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    // Keamanan: Untuk mencegah email enumeration, selalu kembalikan pesan sukses
    if (!user) {
      return {
        message:
          'Jika email terdaftar di sistem kami, instruksi reset password telah dikirimkan ke email Anda.',
      };
    }

    // 1. Hapus token reset lama milik user jika ada
    await this.passwordResetRepository.deleteUserTokens(user.id);

    // 2. Generate token acak aman (32 bytes hex = 64 karakter)
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Set masa kadaluarsa 15 menit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 4. Simpan ke database
    await this.passwordResetRepository.createToken(user.id, token, expiresAt);

    // 5. Buat URL reset password frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // 6. Kirim email via MailService (Resend)
    await this.mailService.sendPasswordResetEmail(user.email, user.name, resetLink);

    return {
      message:
        'Jika email terdaftar di sistem kami, instruksi reset password telah dikirimkan ke email Anda.',
    };
  }

  // ─── Reset Password ─────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.passwordResetRepository.findToken(dto.token);

    if (!resetRecord) {
      throw new BadRequestException('Token reset password tidak valid atau sudah tidak berlaku.');
    }

    // Cek kadaluarsa (15 menit)
    if (resetRecord.expiresAt < new Date()) {
      await this.passwordResetRepository.deleteToken(resetRecord.id);
      throw new BadRequestException(
        'Token reset password telah kadaluarsa. Silakan ajukan permintaan reset password baru.',
      );
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password di User table
    await this.userRepository.update(resetRecord.userId, {
      password: hashedPassword,
    });

    // Hapus token reset yang sudah terpakai
    await this.passwordResetRepository.deleteToken(resetRecord.id);

    // Hapus seluruh sesi aktif user untuk keamanan (agar di-logout dari perangkat lain)
    await this.sessionRepository.deleteAllUserSessions(resetRecord.userId);

    return {
      message:
        'Password Anda berhasil diperbarui. Silakan login kembali dengan password baru Anda.',
    };
  }

  // ─── Me ─────────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    return this.userRepository.findOneWithProfile(userId);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessExpires = (process.env.JWT_ACCESS_EXPIRES || '15m') as StringValue;
    const refreshExpires = (process.env.JWT_REFRESH_EXPIRES || '7d') as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpires,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, refreshToken: string, userAgent?: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.sessionRepository.createSession({
      userId,
      refreshToken: hashed,
      userAgent,
    });
  }
}
