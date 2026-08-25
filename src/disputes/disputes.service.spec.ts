import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';

describe('DisputesService', () => {
  let service: DisputesService;
  let disputesRepository: jest.Mocked<Partial<DisputesRepository>>;

  const mockDispute = {
    id: 'disp-001',
    commissionId: 'c-001',
    reason: 'Karya tidak sesuai kesepakatan deskripsi awal.',
    status: 'pending' as const,
    mediatorId: null,
    createdAt: new Date('2024-08-15T12:00:00Z'),
    mediator: null,
    commission: {
      id: 'c-001',
      artistsId: 'u-001',
      clientId: 'u-005',
      commissionTitle: 'Ilustrasi keluarga',
      description: 'Deskripsi komisi',
      price: 450000,
      status: 'disputed' as const,
      paymentStatus: 'paid' as const,
      paymentMethod: 'wallet' as const,
      artist: {
        id: 'u-001',
        name: 'Ari Ramadan',
        email: 'ari@example.com',
        profile: { avatarUrl: null },
      },
      client: {
        id: 'u-005',
        name: 'Dimas Prasetyo',
        email: 'dimas@example.com',
        balance: 2000000,
        profile: { avatarUrl: null },
      },
    },
  };

  beforeEach(async () => {
    disputesRepository = {
      createDispute: jest.fn(),
      findAllDisputes: jest.fn(),
      findDisputeById: jest.fn(),
      findDisputeByCommissionId: jest.fn(),
      resolveDispute: jest.fn(),
      findCommissionById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DisputesService, { provide: DisputesRepository, useValue: disputesRepository }],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create dispute successfully when requested by commission client', async () => {
      (disputesRepository.findCommissionById as jest.Mock).mockResolvedValue({
        id: 'c-001',
        clientId: 'u-005',
        artistsId: 'u-001',
        status: 'in_progress',
      });
      (disputesRepository.findDisputeByCommissionId as jest.Mock).mockResolvedValue(null);
      (disputesRepository.createDispute as jest.Mock).mockResolvedValue(mockDispute);

      const result = await service.create('u-005', {
        commissionId: 'c-001',
        reason: 'Karya tidak sesuai kesepakatan deskripsi awal.',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('disp-001');
      expect(result?.status).toBe('pending');
    });

    it('should throw NotFoundException if commission does not exist', async () => {
      (disputesRepository.findCommissionById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create('u-005', {
          commissionId: 'non-existent',
          reason: 'Reason',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if commission is already completed or cancelled', async () => {
      (disputesRepository.findCommissionById as jest.Mock).mockResolvedValue({
        id: 'c-001',
        clientId: 'u-005',
        artistsId: 'u-001',
        status: 'completed',
      });

      await expect(
        service.create('u-005', {
          commissionId: 'c-001',
          reason: 'Reason',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return list of disputes', async () => {
      (disputesRepository.findAllDisputes as jest.Mock).mockResolvedValue([mockDispute]);

      const results = await service.findAll();
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('disp-001');
    });
  });

  describe('resolve', () => {
    it('should resolve dispute as approved (refund to client)', async () => {
      (disputesRepository.findDisputeById as jest.Mock).mockResolvedValue(mockDispute);
      (disputesRepository.resolveDispute as jest.Mock).mockResolvedValue({
        ...mockDispute,
        status: 'approved',
        mediatorId: 'u-008',
      });

      const result = await service.resolve('disp-001', 'u-008', { status: 'approved' });
      expect(result?.status).toBe('approved');
      expect(result?.mediator_id).toBe('u-008');
    });
  });
});
