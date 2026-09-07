import { Injectable } from '@nestjs/common';
import type { AppealStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAppealInput {
  artistId: string;
  reason: string;
}

export interface ResolveAppealInput {
  status: AppealStatus;
  resolvedById: string;
  resolutionNotes?: string;
}

export interface AppealFilterInput {
  status?: AppealStatus;
  artistId?: string;
  page?: number;
  limit?: number;
}

// Selector yang digunakan untuk include data yang dibutuhkan dalam appeals
const appealWithRelationsSelect = {
  include: {
    artist: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: {
          select: {
            strikeCount: true,
            isVerified: true,
            avatarUrl: true,
          },
        },
      },
    },
    resolvedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
  },
};

/**
 * Class Repository untuk handle logic data appeals
 */
@Injectable()
export class AppealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAppealInput) {
    return this.prisma.appeal.create({
      data: {
        artistId: data.artistId,
        reason: data.reason,
      },
      ...appealWithRelationsSelect,
    });
  }

  async findAll(filter: AppealFilterInput = {}) {
    const { status, artistId } = filter;
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (artistId) {
      where.artistId = artistId;
    }

    return this.prisma.appeal.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      ...appealWithRelationsSelect,
    });
  }

  async findById(id: string) {
    return this.prisma.appeal.findUnique({
      where: { id },
      ...appealWithRelationsSelect,
    });
  }

  async findPendingByArtistId(artistId: string) {
    return this.prisma.appeal.findFirst({
      where: {
        artistId,
        status: 'pending',
      },
      ...appealWithRelationsSelect,
    });
  }

  async findByArtistId(artistId: string) {
    return this.prisma.appeal.findMany({
      where: { artistId },
      orderBy: {
        createdAt: 'desc',
      },
      ...appealWithRelationsSelect,
    });
  }

  async update(id: string, data: ResolveAppealInput) {
    return this.prisma.appeal.update({
      where: { id },
      data: {
        status: data.status,
        resolvedById: data.resolvedById,
        resolutionNotes: data.resolutionNotes || null,
      },
      ...appealWithRelationsSelect,
    });
  }

  async resetArtistStrikeCount(artistId: string): Promise<void> {
    await this.prisma.profile.updateMany({
      where: { userId: artistId },
      data: { strikeCount: 0 },
    });
  }
}
