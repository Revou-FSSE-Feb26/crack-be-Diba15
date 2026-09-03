import { Injectable } from '@nestjs/common';
import type { UsersRepositoryInterface } from '../common/interfaces/users.repository.interface';
import type { Prisma, Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Class Repository untuk handle logic data user
 * Meng-implementasi dari interface UsersRepositoryInterface
 */
@Injectable()
export class UsersRepository implements UsersRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createWithProfile(data: { name: string; email: string; password: string; role?: Role }) {
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

  async findAllWithProfile() {
    return this.prisma.user.findMany({
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
          },
        },
      },
    });
  }

  async findOneWithProfile(id: string) {
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

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getBalance(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, balance: true },
    });
  }

  async topUp(id: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          balance: {
            increment: amount,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          balance: true,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: id,
          type: 'topup',
          amount,
          title: 'Top Up Saldo E-Wallet',
          status: 'success',
        },
      });

      return user;
    });
  }

  async withdraw(id: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          balance: {
            decrement: amount,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          balance: true,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: id,
          type: 'withdraw',
          amount,
          title: 'Penarikan Dana Artis (Withdraw)',
          status: 'success',
        },
      });

      return user;
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
