import type { TransactionStatus, TransactionType } from '../../generated/prisma/enums';

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amount: number;
  title: string;
  status?: TransactionStatus;
  commissionId?: string;
  metadata?: any;
}

export interface TransactionFilterInput {
  userId?: string;
  type?: TransactionType;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export interface FinancialSummaryResult {
  totalGmv: number;
  escrowBalance: number;
  platformFeeRevenue: number;
  totalWithdrawals: number;
  activeCommissionsCount: number;
}

export interface TransactionsRepositoryInterface {
  createTransaction(data: CreateTransactionInput): Promise<any>;
  findByUserId(userId: string): Promise<any[]>;
  findAll(
    filter?: TransactionFilterInput,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }>;
  getFinancialSummary(): Promise<FinancialSummaryResult>;
  findTransactionById(id: string): Promise<any | null>;
}
