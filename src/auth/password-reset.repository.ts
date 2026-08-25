import { Injectable } from '@nestjs/common';
import type { PasswordResetRepositoryInterface } from '../common/interfaces/password-reset.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PasswordResetRepository implements PasswordResetRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findToken(token: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  }

  async deleteToken(id: string) {
    return this.prisma.passwordResetToken.delete({
      where: { id },
    });
  }

  async deleteUserTokens(userId: string) {
    return this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }
}
