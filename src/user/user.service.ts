import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { TopUpDto } from './dto/topup.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.userRepository.findById(id);
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userRepository.createWithProfile({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    return this.userRepository.findAllWithProfile();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneWithProfile(id);
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

    const user = await this.userRepository.update(id, data);

    const { password, ...result } = user;
    return result;
  }

  async getBalance(userId: string) {
    const user = await this.userRepository.getBalance(userId);
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

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    const updated = await this.userRepository.topUp(userId, dto.amount);
    return {
      message: 'Top-up saldo berhasil.',
      user: updated,
    };
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan.');
    }
    await this.userRepository.delete(id);
    return { message: 'User berhasil dihapus.' };
  }
}
