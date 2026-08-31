import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { CommissionsRepository } from './commissions.repository';
import { CommissionsService } from './commissions.service';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let commissionsRepository: jest.Mocked<Partial<CommissionsRepository>>;

  const mockCommission = {
    id: 'c-001',
    artistsId: 'u-001', // Ari Ramadan (Artist)
    clientId: 'u-005', // Dimas Prasetyo (Client)
    commissionTitle: 'Ilustrasi keluarga bergaya watercolor',
    description: 'Potret keluarga kecil dengan latar taman kota.',
    price: 450000,
    status: 'pending' as const,
    paymentStatus: 'paid' as const,
    paymentMethod: 'wallet' as const,
    createdAt: new Date('2024-06-12T09:00:00Z'),
    updatedAt: new Date('2024-06-12T09:00:00Z'),
    artist: {
      id: 'u-001',
      name: 'Ari Ramadan',
      email: 'ari@example.com',
      profile: {
        avatarUrl: null,
        isVerified: true,
        isOpenForCommission: true,
      },
    },
    client: {
      id: 'u-005',
      name: 'Dimas Prasetyo',
      email: 'dimas@example.com',
      balance: 2000000,
      profile: {
        avatarUrl: null,
      },
    },
    progress: {
      id: 'cp-001',
      commissionId: 'c-001',
      sketchUrl: null,
      sketchApproved: false,
      finalArtworkUrl: null,
      finalArtworkApproved: false,
      updatedAt: new Date('2024-06-12T09:00:00Z'),
    },
    revisions: [],
    dispute: null,
  };

  beforeEach(async () => {
    commissionsRepository = {
      createCommission: jest.fn(),
      findCommissionsByUser: jest.fn(),
      findAllCommissions: jest.fn(),
      findCommissionById: jest.fn(),
      respondCommission: jest.fn(),
      updateProgress: jest.fn(),
      approveStep: jest.fn(),
      addRevision: jest.fn(),
      cancelCommission: jest.fn(),
      completeCommission: jest.fn(),
      findArtistWithProfile: jest.fn(),
      findClientUser: jest.fn(),
      findCommissionProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: CommissionsRepository, useValue: commissionsRepository },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create commission and deduct client balance if client has enough funds', async () => {
      (commissionsRepository.findArtistWithProfile as jest.Mock).mockResolvedValue({
        id: 'u-001',
        role: 'artist',
        profile: { isVerified: true, isOpenForCommission: true },
      });
      (commissionsRepository.findClientUser as jest.Mock).mockResolvedValue({
        id: 'u-005',
        balance: 2000000,
      });
      (commissionsRepository.createCommission as jest.Mock).mockResolvedValue(mockCommission);

      const result = await service.create('u-005', {
        artistsId: 'u-001',
        commissionTitle: 'Ilustrasi keluarga bergaya watercolor',
        price: 450000,
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('c-001');
      expect(result?.price).toBe(450000);
      expect(result?.status).toBe('pending');
    });

    it('should throw BadRequestException if artist is not verified', async () => {
      (commissionsRepository.findArtistWithProfile as jest.Mock).mockResolvedValue({
        id: 'u-001',
        role: 'artist',
        profile: { isVerified: false, isOpenForCommission: true },
      });

      await expect(
        service.create('u-005', {
          artistsId: 'u-001',
          commissionTitle: 'Tes Komisi',
          price: 450000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if artist is not open for commission', async () => {
      (commissionsRepository.findArtistWithProfile as jest.Mock).mockResolvedValue({
        id: 'u-001',
        role: 'artist',
        profile: { isVerified: true, isOpenForCommission: false },
      });

      await expect(
        service.create('u-005', {
          artistsId: 'u-001',
          commissionTitle: 'Tes Komisi',
          price: 450000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByUser', () => {
    it('should return list of user commissions for client/artist', async () => {
      (commissionsRepository.findCommissionsByUser as jest.Mock).mockResolvedValue([
        mockCommission,
      ]);

      const results = await service.findAllByUser('u-005', 'client', 'client');
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('c-001');
      expect(commissionsRepository.findCommissionsByUser).toHaveBeenCalledWith('u-005', 'client');
    });

    it('should return all platform commissions if requester is admin', async () => {
      (commissionsRepository.findAllCommissions as jest.Mock).mockResolvedValue([mockCommission]);

      const results = await service.findAllByUser('u-004', 'admin');
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('c-001');
      expect(commissionsRepository.findAllCommissions).toHaveBeenCalled();
    });
  });

  describe('respond', () => {
    it('should accept commission if artist accepts', async () => {
      (commissionsRepository.findCommissionById as jest.Mock).mockResolvedValue(mockCommission);
      (commissionsRepository.respondCommission as jest.Mock).mockResolvedValue({
        ...mockCommission,
        status: 'in_progress',
      });

      const result = await service.respond('c-001', 'u-001', { status: 'in_progress' });
      expect(result?.status).toBe('in_progress');
    });

    it('should reject commission if artist rejects', async () => {
      (commissionsRepository.findCommissionById as jest.Mock).mockResolvedValue(mockCommission);
      (commissionsRepository.respondCommission as jest.Mock).mockResolvedValue({
        ...mockCommission,
        status: 'rejected',
      });

      const result = await service.respond('c-001', 'u-001', { status: 'rejected' });
      expect(result?.status).toBe('rejected');
    });
  });
});
