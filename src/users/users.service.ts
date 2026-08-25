import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { CreateUserDto } from './dto/create-user.dto';
import type { TopUpDto } from './dto/topup.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { WithdrawDto } from './dto/withdraw.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.usersRepository.createWithProfile({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    return this.usersRepository.findAllWithProfile();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOneWithProfile(id);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.usersRepository.update(id, data);

    const { password, ...result } = user;
    return result;
  }

  async getBalance(userId: string) {
    const user = await this.usersRepository.getBalance(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }
    return {
      userId: user.id,
      balance: user.balance,
    };
  }

  async topUp(userId: string, dto: TopUpDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Nominal top-up harus lebih dari 0.');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    const updated = await this.usersRepository.topUp(userId, dto.amount);
    return {
      message: 'Top-up saldo berhasil.',
      user: updated,
    };
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    if (!dto.amount || dto.amount < 100000) {
      throw new BadRequestException('Minimal penarikan dana adalah Rp 100.000.');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    if (user.role !== 'artist') {
      throw new ForbiddenException('Hanya akun artist yang dapat melakukan penarikan dana.');
    }

    if (user.balance < dto.amount) {
      throw new BadRequestException(
        'Saldo Anda tidak mencukupi untuk melakukan penarikan dana ini.',
      );
    }

    const updated = await this.usersRepository.withdraw(userId, dto.amount);
    return {
      message: `Permintaan penarikan dana sebesar Rp ${dto.amount.toLocaleString('id-ID')} berhasil diproses.`,
      payout: {
        amount: dto.amount,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        processedAt: new Date().toISOString(),
      },
      user: updated,
    };
  }

  async remove(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }
    await this.usersRepository.delete(id);
    return { message: 'User berhasil dihapus.' };
  }
}
