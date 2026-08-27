import { Test, type TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: jest.Mocked<Partial<TransactionsService>>;

  const mockTransactionResponse = {
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
  };

  beforeEach(async () => {
    service = {
      getMyTransactions: jest.fn().mockResolvedValue([mockTransactionResponse]),
      getAllTransactions: jest.fn().mockResolvedValue({
        data: [mockTransactionResponse],
        total: 1,
        page: 1,
        limit: 10,
      }),
      getFinancialSummary: jest.fn().mockResolvedValue({
        total_gmv: 5000000,
        escrow_balance: 1500000,
        platform_fee_revenue: 250000,
        total_withdrawals: 1000000,
        active_commissions_count: 3,
      }),
      getTransactionById: jest.fn().mockResolvedValue(mockTransactionResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: service }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyTransactions', () => {
    it('should call service.getMyTransactions with user id', async () => {
      const result = await controller.getMyTransactions('u-005');
      expect(service.getMyTransactions).toHaveBeenCalledWith('u-005');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-001');
    });
  });

  describe('getFinancialSummary', () => {
    it('should call service.getFinancialSummary', async () => {
      const result = await controller.getFinancialSummary();
      expect(service.getFinancialSummary).toHaveBeenCalled();
      expect(result.total_gmv).toBe(5000000);
      expect(result.platform_fee_revenue).toBe(250000);
    });
  });

  describe('getAllTransactions', () => {
    it('should call service.getAllTransactions with filter query', async () => {
      const dto = { page: 1, limit: 10 };
      const result = await controller.getAllTransactions(dto as any);
      expect(service.getAllTransactions).toHaveBeenCalledWith(dto);
      expect(result.total).toBe(1);
    });
  });

  describe('getTransactionById', () => {
    it('should call service.getTransactionById with param id', async () => {
      const result = await controller.getTransactionById('tx-001');
      expect(service.getTransactionById).toHaveBeenCalledWith('tx-001');
      expect(result.id).toBe('tx-001');
    });
  });
});
