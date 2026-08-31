import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TransactionsRepositoryInterface } from '../common/interfaces/transactions.repository.interface';
import type { FilterTransactionDto } from './dto/filter-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject('ITransactionsRepository')
    private readonly transactionsRepository: TransactionsRepositoryInterface,
  ) {}

  private mapTransaction(tx: any) {
    if (!tx) return null;
    return {
      id: tx.id,
      user_id: tx.userId,
      type: tx.type,
      amount: tx.amount,
      title: tx.title,
      status: tx.status,
      commission_id: tx.commissionId || null,
      metadata: tx.metadata || null,
      created_at: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
      user: tx.user
        ? {
            id: tx.user.id,
            name: tx.user.name,
            email: tx.user.email,
            role: tx.user.role,
          }
        : undefined,
      commission: tx.commission
        ? {
            id: tx.commission.id,
            commission_title: tx.commission.commissionTitle,
            price: tx.commission.price,
            status: tx.commission.status,
          }
        : undefined,
    };
  }

  async getMyTransactions(userId: string) {
    const list = await this.transactionsRepository.findByUserId(userId);
    return list.map((tx) => this.mapTransaction(tx));
  }

  async getAllTransactions(dto: FilterTransactionDto) {
    const result = await this.transactionsRepository.findAll({
      userId: dto.userId,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((tx) => this.mapTransaction(tx)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async getFinancialSummary() {
    const summary = await this.transactionsRepository.getFinancialSummary();
    return {
      total_gmv: summary.totalGmv,
      escrow_balance: summary.escrowBalance,
      platform_fee_revenue: summary.platformFeeRevenue,
      total_withdrawals: summary.totalWithdrawals,
      active_commissions_count: summary.activeCommissionsCount,
    };
  }

  async getTransactionById(id: string) {
    const tx = await this.transactionsRepository.findTransactionById(id);
    if (!tx) {
      throw new NotFoundException('Transaksi tidak ditemukan.');
    }
    return this.mapTransaction(tx);
  }
}
