import { Injectable } from '@nestjs/common';
import type {
  CreateTransactionInput,
  FinancialSummaryResult,
  TransactionFilterInput,
  TransactionsRepositoryInterface,
} from '../common/interfaces/transactions.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

const transactionWithRelationsSelect = {
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    commission: {
      select: {
        id: true,
        commissionTitle: true,
        price: true,
        status: true,
      },
    },
  },
};

@Injectable()
export class TransactionsRepository implements TransactionsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(data: CreateTransactionInput) {
    return this.prisma.walletTransaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        title: data.title,
        status: data.status || 'success',
        commissionId: data.commissionId || null,
        metadata: data.metadata !== undefined ? data.metadata : undefined,
      },
      ...transactionWithRelationsSelect,
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      ...transactionWithRelationsSelect,
    });
  }

  async findAll(filter: TransactionFilterInput = {}) {
    const { userId, type, startDate, endDate, page = 1, limit = 10 } = filter;
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        ...transactionWithRelationsSelect,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findTransactionById(id: string) {
    return this.prisma.walletTransaction.findUnique({
      where: { id },
      ...transactionWithRelationsSelect,
    });
  }

  async getFinancialSummary(): Promise<FinancialSummaryResult> {
    // 1. Ambil seluruh komisi platform untuk kalkulasi akurat GMV dan Escrow
    const commissions = await this.prisma.commission.findMany({
      select: {
        id: true,
        price: true,
        status: true,
        paymentStatus: true,
      },
    });

    let totalGmv = 0;
    let escrowBalance = 0;
    let activeCommissionsCount = 0;

    for (const c of commissions) {
      // GMV dihitung dari seluruh komisi yang pembayarannya telah masuk (paid / released)
      if (c.paymentStatus === 'paid' || c.paymentStatus === 'released') {
        totalGmv += c.price;
      }

      // Escrow: komisi berbayar yang masih aktif berjalan dan belum direlease ke artis
      if (
        c.paymentStatus === 'paid' &&
        (c.status === 'in_progress' ||
          c.status === 'revision' ||
          c.status === 'disputed' ||
          c.status === 'accepted')
      ) {
        escrowBalance += c.price;
      }

      if (
        c.status === 'in_progress' ||
        c.status === 'revision' ||
        c.status === 'disputed' ||
        c.status === 'pending'
      ) {
        activeCommissionsCount++;
      }
    }

    // 2. Ambil total Fee platform 5% dari tabel wallet_transactions (atau kalkulasi 5% dari komisi selesai)
    const feeTxAggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        type: 'platform_fee',
        status: 'success',
      },
      _sum: {
        amount: true,
      },
    });

    // Fallback fee: jika belum ada record tx, kalkulasi dari 5% komisi yang berstatus released
    const calculatedCompletedFee = commissions
      .filter((c) => c.paymentStatus === 'released' && c.status === 'completed')
      .reduce((sum, c) => sum + Math.round(c.price * 0.05), 0);

    const platformFeeRevenue = feeTxAggregate._sum.amount ?? calculatedCompletedFee;

    // 3. Ambil total penarikan dana artis (withdraw)
    const withdrawTxAggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        type: 'withdraw',
        status: 'success',
      },
      _sum: {
        amount: true,
      },
    });

    const totalWithdrawals = withdrawTxAggregate._sum.amount ?? 0;

    return {
      totalGmv,
      escrowBalance,
      platformFeeRevenue,
      totalWithdrawals,
      activeCommissionsCount,
    };
  }
}
