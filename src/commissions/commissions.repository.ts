import { Injectable } from '@nestjs/common';
import type { CommissionStatus, PaymentMethod } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const commissionWithRelationsSelect = {
  include: {
    artist: {
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            avatarUrl: true,
            isVerified: true,
            isOpenForCommission: true,
          },
        },
      },
    },
    client: {
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
    },
    progress: true,
    revisions: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    dispute: true,
  },
};

@Injectable()
export class CommissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCommission(
    clientId: string,
    data: {
      artistsId: string;
      commissionTitle: string;
      description?: string;
      price: number;
      paymentMethod?: PaymentMethod;
    },
  ) {
    const { artistsId, commissionTitle, description, price, paymentMethod } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Potong saldo client
      await tx.user.update({
        where: { id: clientId },
        data: {
          balance: {
            decrement: price,
          },
        },
      });

      // 2. Buat komisi
      const commission = await tx.commission.create({
        data: {
          clientId,
          artistsId,
          commissionTitle,
          description: description || null,
          price,
          status: 'pending',
          paymentStatus: 'paid',
          paymentMethod: paymentMethod || 'wallet',
        },
      });

      // 3. Inisialisasi progress komisi
      await tx.commissionProgress.create({
        data: {
          commissionId: commission.id,
        },
      });

      return tx.commission.findUnique({
        where: { id: commission.id },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async findCommissionsByUser(userId: string, role?: 'client' | 'artist') {
    const where: any = {};
    if (role === 'artist') {
      where.artistsId = userId;
    } else if (role === 'client') {
      where.clientId = userId;
    } else {
      where.OR = [{ clientId: userId }, { artistsId: userId }];
    }

    return this.prisma.commission.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      ...commissionWithRelationsSelect,
    });
  }

  async findCommissionById(id: string) {
    return this.prisma.commission.findUnique({
      where: { id },
      ...commissionWithRelationsSelect,
    });
  }

  async respondCommission(id: string, status: CommissionStatus) {
    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id },
      });
      if (!commission) return null;

      if (status === 'cancelled' || status === ('rejected' as any)) {
        // Refund saldo ke client jika ditolak
        await tx.user.update({
          where: { id: commission.clientId },
          data: {
            balance: {
              increment: commission.price,
            },
          },
        });

        return tx.commission.update({
          where: { id },
          data: {
            status: 'cancelled',
            paymentStatus: 'refunded',
          },
          ...commissionWithRelationsSelect,
        });
      }

      return tx.commission.update({
        where: { id },
        data: {
          status: 'in_progress',
        },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async updateProgress(
    commissionId: string,
    data: { sketchUrl?: string; finalArtworkUrl?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.commissionProgress.upsert({
        where: { commissionId },
        update: {
          sketchUrl: data.sketchUrl !== undefined ? data.sketchUrl : undefined,
          finalArtworkUrl: data.finalArtworkUrl !== undefined ? data.finalArtworkUrl : undefined,
        },
        create: {
          commissionId,
          sketchUrl: data.sketchUrl || null,
          finalArtworkUrl: data.finalArtworkUrl || null,
        },
      });

      return tx.commission.findUnique({
        where: { id: commissionId },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async approveStep(commissionId: string, step: 'sketch' | 'final') {
    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id: commissionId },
      });
      if (!commission) return null;

      if (step === 'sketch') {
        await tx.commissionProgress.update({
          where: { commissionId },
          data: { sketchApproved: true },
        });
      } else if (step === 'final') {
        // Approve final -> pelepasan dana dari escrow ke wallet artis
        await tx.commissionProgress.update({
          where: { commissionId },
          data: { finalArtworkApproved: true },
        });

        await tx.user.update({
          where: { id: commission.artistsId },
          data: {
            balance: {
              increment: commission.price,
            },
          },
        });

        await tx.commission.update({
          where: { id: commissionId },
          data: {
            status: 'completed',
            paymentStatus: 'released',
          },
        });
      }

      return tx.commission.findUnique({
        where: { id: commissionId },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async addRevision(commissionId: string, userId: string, comment: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.revision.create({
        data: {
          commissionId,
          userId,
          comment,
        },
      });

      await tx.commission.update({
        where: { id: commissionId },
        data: {
          status: 'revision',
        },
      });

      return tx.commission.findUnique({
        where: { id: commissionId },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async cancelCommission(commissionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id: commissionId },
      });
      if (!commission) return null;

      // Refund dana ke client
      await tx.user.update({
        where: { id: commission.clientId },
        data: {
          balance: {
            increment: commission.price,
          },
        },
      });

      return tx.commission.update({
        where: { id: commissionId },
        data: {
          status: 'cancelled',
          paymentStatus: 'refunded',
        },
        ...commissionWithRelationsSelect,
      });
    });
  }
}
