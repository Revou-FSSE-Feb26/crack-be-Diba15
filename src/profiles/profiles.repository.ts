import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Class Repository untuk handle logic data profile
 */
@Injectable()
export class ProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

  async update(userId: string, data: Prisma.ProfileUpdateInput) {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async updateAvatarUrl(userId: string, avatarUrl: string) {
    return this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });
  }
}
