import { Injectable } from '@nestjs/common';
import type { DisputesRepositoryInterface } from '../common/interfaces/disputes.repository.interface';
import type { DisputeStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

// Selector untuk mengambil data dispute beserta relasinya
const disputeWithRelationsSelect = {
  include: {
    mediator: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    commission: {
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatarUrl: true,
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
      },
    },
  },
};

/**
 * Class Repository untuk handle logic data dispute
 * Meng-implementasi dari interface DisputesRepositoryInterface
 */
@Injectable()
export class DisputesRepository implements DisputesRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async createDispute(commissionId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commissionId },
        data: {
          status: 'disputed',
        },
      });

      const dispute = await tx.disputeLog.create({
        data: {
          commissionId,
          reason,
          status: 'pending',
        },
      });

      return tx.disputeLog.findUnique({
        where: { id: dispute.id },
        ...disputeWithRelationsSelect,
      });
    });
  }

  async findAllDisputes(status?: DisputeStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.disputeLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      ...disputeWithRelationsSelect,
    });
  }

  async findDisputeById(id: string) {
    return this.prisma.disputeLog.findUnique({
      where: { id },
      ...disputeWithRelationsSelect,
    });
  }

  async findDisputeByCommissionId(commissionId: string) {
    return this.prisma.disputeLog.findUnique({
      where: { commissionId },
      ...disputeWithRelationsSelect,
    });
  }

  async resolveDispute(id: string, mediatorId: string, status: DisputeStatus) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.disputeLog.findUnique({
        where: { id },
        include: { commission: true },
      });

      if (!dispute?.commission) return null;

      const commission = dispute.commission;

      if (status === 'approved') {
        // Dispute disetujui (Client menang sengketa) -> Refund saldo ke Client
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
            title: 'Pengembalian Dana Resolusi Sengketa Komisi',
            commissionId: commission.id,
            status: 'success',
            metadata: {
              dispute_id: id,
              mediator_id: mediatorId,
            },
          },
        });

        await tx.commission.update({
          where: { id: commission.id },
          data: {
            status: 'cancelled',
            paymentStatus: 'refunded',
          },
        });
      } else if (status === 'rejected') {
        // Dispute ditolak (Artis menang sengketa) -> Komisi kembali ke status revision (Review Hasil)
        await tx.commission.update({
          where: { id: commission.id },
          data: {
            status: 'revision',
          },
        });
      }

      return tx.disputeLog.update({
        where: { id },
        data: {
          mediatorId,
          status,
        },
        ...disputeWithRelationsSelect,
      });
    });
  }

  async findCommissionById(id: string) {
    return this.prisma.commission.findUnique({
      where: { id },
    });
  }
}
