import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { TransactionsRepositoryInterface } from '../common/interfaces/transactions.repository.interface';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: jest.Mocked<TransactionsRepositoryInterface>;

  const mockTransaction = {
    id: 'tx-001',
    userId: 'u-005', // Dimas Prasetyo (Client)
    type: 'topup' as const,
    amount: 500000,
    title: 'Top Up Saldo E-Wallet',
    status: 'success' as const,
    commissionId: null,
    metadata: null,
    createdAt: new Date('2024-05-01T10:00:00Z'),
    user: {
      id: 'u-005',
      name: 'Dimas Prasetyo',
      email: 'dimas@example.com',
      role: 'client' as const,
    },
    commission: null,
  };

  beforeEach(async () => {
    repository = {
      createTransaction: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      getFinancialSummary: jest.fn(),
      findTransactionById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: 'ITransactionsRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyTransactions', () => {
    it('should return mapped transactions for user', async () => {
      repository.findByUserId.mockResolvedValue([mockTransaction]);

      const result = await service.getMyTransactions('u-005');

      expect(repository.findByUserId).toHaveBeenCalledWith('u-005');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'tx-001',
        user_id: 'u-005',
        type: 'topup',
        amount: 500000,
        title: 'Top Up Saldo E-Wallet',
        status: 'success',
        commission_id: null,
        metadata: null,
        created_at: '2024-05-01T10:00:00.000Z',
        user: {
          id: 'u-005',
          name: 'Dimas Prasetyo',
          email: 'dimas@example.com',
          role: 'client',
        },
        commission: undefined,
      });
    });
  });

  describe('getAllTransactions', () => {
    it('should return paginated transactions with filters', async () => {
      repository.findAll.mockResolvedValue({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.getAllTransactions({
        type: 'topup',
        page: 1,
        limit: 10,
      });

      expect(repository.findAll).toHaveBeenCalledWith({
        userId: undefined,
        type: 'topup',
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('getFinancialSummary', () => {
    it('should return calculated financial summary', async () => {
      repository.getFinancialSummary.mockResolvedValue({
        totalGmv: 5000000,
        escrowBalance: 1500000,
        platformFeeRevenue: 250000,
        totalWithdrawals: 1000000,
        activeCommissionsCount: 3,
      });

      const result = await service.getFinancialSummary();

      expect(repository.getFinancialSummary).toHaveBeenCalled();
      expect(result).toEqual({
        total_gmv: 5000000,
        escrow_balance: 1500000,
        platform_fee_revenue: 250000,
        total_withdrawals: 1000000,
        active_commissions_count: 3,
      });
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction if found', async () => {
      repository.findTransactionById.mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById('tx-001');

      expect(repository.findTransactionById).toHaveBeenCalledWith('tx-001');
      expect(result.id).toBe('tx-001');
      expect(result.amount).toBe(500000);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      repository.findTransactionById.mockResolvedValue(null);

      await expect(service.getTransactionById('tx-999')).rejects.toThrow(NotFoundException);
    });
  });
});
