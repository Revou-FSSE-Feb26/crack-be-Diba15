import { Injectable } from '@nestjs/common';
import type { CommissionsRepositoryInterface } from '../common/interfaces/commissions.repository.interface';
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
export class CommissionsRepository implements CommissionsRepositoryInterface {
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
      // 1. Buat komisi dengan status pending & unpaid (saldo dipotong saat client bayar setelah diterima artist)
      const commission = await tx.commission.create({
        data: {
          clientId,
          artistsId,
          commissionTitle,
          description: description || null,
          price,
          status: 'pending',
          paymentStatus: 'unpaid',
          paymentMethod: paymentMethod || 'wallet',
        },
      });

      // 2. Inisialisasi progress komisi
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

  async findAllCommissions(role?: 'client' | 'artist') {
    const where: any = {};
    if (role === 'artist') {
      where.artistsId = { not: undefined };
    } else if (role === 'client') {
      where.clientId = { not: undefined };
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
        if (commission.paymentStatus === 'paid') {
          await tx.user.update({
            where: { id: commission.clientId },
            data: {
              balance: {
                increment: commission.price,
              },
            },
          });

          await tx.walletTransaction.create({
            data: {
              userId: commission.clientId,
              type: 'refund',
              amount: commission.price,
              title: `Pengembalian Dana Penolakan Komisi "${commission.commissionTitle}"`,
              commissionId: commission.id,
              status: 'success',
            },
          });
        }

        return tx.commission.update({
          where: { id },
          data: {
            status: 'cancelled',
            paymentStatus: commission.paymentStatus === 'paid' ? 'refunded' : 'unpaid',
          },
          ...commissionWithRelationsSelect,
        });
      }

      return tx.commission.update({
        where: { id },
        data: {
          status: 'accepted',
        },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async payCommission(id: string, paymentMethod: PaymentMethod = 'wallet', cardLastFour?: string) {
    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id },
      });
      if (!commission) return null;

      const client = await tx.user.findUnique({
        where: { id: commission.clientId },
      });

      if (paymentMethod === 'wallet' && (!client || client.balance < commission.price)) {
        throw new Error('Saldo E-Wallet Anda tidak mencukupi untuk melakukan pembayaran komisi.');
      }

      if (paymentMethod === 'wallet' && client) {
        await tx.user.update({
          where: { id: commission.clientId },
          data: {
            balance: {
              decrement: commission.price,
            },
          },
        });
      }

      await tx.walletTransaction.create({
        data: {
          userId: commission.clientId,
          type: 'payment',
          amount: commission.price,
          title: `Pembayaran Komisi "${commission.commissionTitle}" (Escrow)`,
          commissionId: commission.id,
          status: 'success',
          metadata: {
            payment_method: paymentMethod,
            card_last_four: cardLastFour || null,
          },
        },
      });

      return tx.commission.update({
        where: { id },
        data: {
          status: 'in_progress',
          paymentStatus: 'paid',
          paymentMethod,
          cardLastFour: cardLastFour || null,
        },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async updateProgress(
    commissionId: string,
    data: {
      sketch_url?: string;
      final_artwork_url?: string;
      final_file_url?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.commissionProgress.upsert({
        where: { commissionId },
        update: {
          sketchUrl: data.sketch_url !== undefined ? data.sketch_url : undefined,
          finalArtworkUrl:
            data.final_artwork_url !== undefined ? data.final_artwork_url : undefined,
          finalFileUrl: data.final_file_url !== undefined ? data.final_file_url : undefined,
        },
        create: {
          commissionId,
          sketchUrl: data.sketch_url || null,
          finalArtworkUrl: data.final_artwork_url || null,
          finalFileUrl: data.final_file_url || null,
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
        // Approve preview final oleh Client -> menandai finalArtworkApproved: true
        await tx.commissionProgress.update({
          where: { commissionId },
          data: { finalArtworkApproved: true },
        });
      }

      return tx.commission.findUnique({
        where: { id: commissionId },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async completeCommission(commissionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const commission = await tx.commission.findUnique({
        where: { id: commissionId },
      });
      if (!commission) return null;

      if (commission.status === 'completed') {
        return tx.commission.findUnique({
          where: { id: commissionId },
          ...commissionWithRelationsSelect,
        });
      }

      // Hitung potongan platform fee 5% dan dana bersih yang diterima artis (95%)
      const platformFee = Math.round(commission.price * 0.05);
      const artistPayout = commission.price - platformFee;

      // Transfer saldo bersih dari Escrow ke wallet artis
      await tx.user.update({
        where: { id: commission.artistsId },
        data: {
          balance: {
            increment: artistPayout,
          },
        },
      });

      // Catat mutasi pencairan dana ke artis
      await tx.walletTransaction.create({
        data: {
          userId: commission.artistsId,
          type: 'release',
          amount: artistPayout,
          title: `Pencairan Dana Komisi "${commission.commissionTitle}"`,
          commissionId: commission.id,
          status: 'success',
        },
      });

      // Catat mutasi fee platform 5%
      await tx.walletTransaction.create({
        data: {
          userId: commission.artistsId,
          type: 'platform_fee',
          amount: platformFee,
          title: `Biaya Layanan Platform 5% ("${commission.commissionTitle}")`,
          commissionId: commission.id,
          status: 'success',
        },
      });

      await tx.commission.update({
        where: { id: commissionId },
        data: {
          status: 'completed',
          paymentStatus: 'released',
        },
      });

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

      if (commission.paymentStatus === 'paid') {
        // Refund dana ke client
        await tx.user.update({
          where: { id: commission.clientId },
          data: {
            balance: {
              increment: commission.price,
            },
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: commission.clientId,
            type: 'refund',
            amount: commission.price,
            title: `Pengembalian Dana Pembatalan Komisi "${commission.commissionTitle}"`,
            commissionId: commission.id,
            status: 'success',
          },
        });
      }

      return tx.commission.update({
        where: { id: commissionId },
        data: {
          status: 'cancelled',
          paymentStatus: commission.paymentStatus === 'paid' ? 'refunded' : 'unpaid',
        },
        ...commissionWithRelationsSelect,
      });
    });
  }

  async findArtistWithProfile(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: 'artist' },
      include: { profile: true },
    });
  }

  async findClientUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findCommissionProgress(commissionId: string) {
    return this.prisma.commissionProgress.findUnique({
      where: { commissionId },
    });
  }
}
