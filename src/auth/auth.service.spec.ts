import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { SessionRepository } from '../session/session.repository';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { PasswordResetRepository } from './password-reset.repository';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<Partial<AuthRepository>>;
  let sessionRepository: jest.Mocked<Partial<SessionRepository>>;
  let passwordResetRepository: jest.Mocked<Partial<PasswordResetRepository>>;
  let mailService: jest.Mocked<Partial<MailService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockUser = {
    id: 'u-001',
    name: 'Ari Ramadan',
    email: 'ari@example.com',
    password: '$2b$10$hashedpassword',
    role: 'artist' as any,
    balance: 500000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    authRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithProfile: jest.fn(),
      register: jest.fn(),
      updatePassword: jest.fn(),
    };

    sessionRepository = {
      findSessionsByUserId: jest.fn(),
      createSession: jest.fn(),
      updateSessionToken: jest.fn(),
      deleteSession: jest.fn(),
      deleteAllUserSessions: jest.fn(),
    };

    passwordResetRepository = {
      createToken: jest.fn(),
      findToken: jest.fn(),
      deleteToken: jest.fn(),
      deleteUserTokens: jest.fn(),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: SessionRepository, useValue: sessionRepository },
        { provide: PasswordResetRepository, useValue: passwordResetRepository },
        { provide: MailService, useValue: mailService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email is already registered', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Ari Ramadan',
          email: 'ari@example.com',
          password: 'password123',
          role: 'artist' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register a new user successfully', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (authRepository.register as jest.Mock).mockResolvedValue(mockUser);
      (sessionRepository.createSession as jest.Mock).mockResolvedValue({ id: 's-001' });

      const result = await service.register({
        name: 'Ari Ramadan',
        email: 'ari@example.com',
        password: 'password123',
        role: 'artist' as any,
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(authRepository.register).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'ari@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should login and return tokens on correct password', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sessionRepository.createSession as jest.Mock).mockResolvedValue({ id: 's-001' });

      const result = await service.login({
        email: 'ari@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
