import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';

describe('DisputesService', () => {
  let service: DisputesService;
  let disputesRepository: jest.Mocked<Partial<DisputesRepository>>;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

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
    };

    prismaService = {
      commission: {
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: DisputesRepository, useValue: disputesRepository },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create dispute successfully when requested by commission client', async () => {
      const findUniqueMock = (prismaService.commission as any).findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue({
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
      const findUniqueMock = (prismaService.commission as any).findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      await expect(
        service.create('u-005', {
          commissionId: 'c-non-existent',
          reason: 'Alasan sengketa',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    it('should resolve dispute as approved and refund client', async () => {
      (disputesRepository.findDisputeById as jest.Mock).mockResolvedValue(mockDispute);
      (disputesRepository.resolveDispute as jest.Mock).mockResolvedValue({
        ...mockDispute,
        status: 'approved' as any,
        mediatorId: 'u-008', // Hendra (Curator)
        mediator: {
          id: 'u-008',
          name: 'Hendra Kurniawan',
          email: 'hendra@trubrush.com',
          role: 'curator',
        },
      });

      const result = await service.resolve('disp-001', 'u-008', {
        status: 'approved' as any,
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe('approved');
      expect(result?.mediator_id).toBe('u-008');
    });

    it('should throw BadRequestException if dispute is already resolved', async () => {
      (disputesRepository.findDisputeById as jest.Mock).mockResolvedValue({
        ...mockDispute,
        status: 'approved',
      });

      await expect(
        service.resolve('disp-001', 'u-008', { status: 'rejected' as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
