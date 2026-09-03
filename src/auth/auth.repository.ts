import { Injectable } from '@nestjs/common';
import type { AuthRepositoryInterface } from '../common/interfaces/auth.repository.interface';
import type { Role, User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Class Repository untuk handle logic data auth
 * Meng-implementasi dari interface AuthRepositoryInterface
 */
@Injectable()
export class AuthRepository implements AuthRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithProfile(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
            instagramUrl: true,
            twitterUrl: true,
            pixivUrl: true,
            websiteUrl: true,
            isVerified: true,
            isOpenForCommission: true,
            basePriceIdr: true,
            strikeCount: true,
            approvedPortfolioCount: true,
          },
        },
      },
    });
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        profile: {
          create: {},
        },
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
