import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { AppealsRepositoryInterface } from '../common/interfaces/appeals.repository.interface';
import { AppealStatus } from '../generated/prisma/enums';
import { AppealsService } from './appeals.service';

describe('AppealsService', () => {
  let service: AppealsService;
  let appealsRepository: jest.Mocked<AppealsRepositoryInterface>;

  const mockAppeal = {
    id: 'app-001',
    artistId: 'u-001', // Ari Ramadan (Artist)
    reason:
      'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
    status: AppealStatus.pending,
    resolvedById: null,
    resolutionNotes: null,
    createdAt: new Date('2024-08-15T10:00:00Z'),
    updatedAt: new Date('2024-08-15T10:00:00Z'),
    artist: {
      id: 'u-001',
      name: 'Ari Ramadan',
      email: 'ari@example.com',
      role: 'artist',
      profile: {
        strikeCount: 5,
        isVerified: true,
        avatarUrl: null,
      },
    },
    resolvedBy: null,
  };

  beforeEach(async () => {
    appealsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findPendingByArtistId: jest.fn(),
      findByArtistId: jest.fn(),
      update: jest.fn(),
      resetArtistStrikeCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppealsService,
        {
          provide: 'IAppealsRepository',
          useValue: appealsRepository,
        },
      ],
    }).compile();

    service = module.get<AppealsService>(AppealsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an appeal successfully', async () => {
      appealsRepository.findPendingByArtistId.mockResolvedValue(null);
      appealsRepository.create.mockResolvedValue(mockAppeal as any);

      const result = await service.create('u-001', {
        reason:
          'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('app-001');
      expect(result.status).toBe(AppealStatus.pending);
      expect(appealsRepository.create).toHaveBeenCalledWith({
        artistId: 'u-001',
        reason:
          'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
      });
    });

    it('should throw BadRequestException if reason is less than 30 characters', async () => {
      await expect(
        service.create('u-001', {
          reason: 'Terlalu pendek',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if artist already has a pending appeal', async () => {
      appealsRepository.findPendingByArtistId.mockResolvedValue(mockAppeal as any);

      await expect(
        service.create('u-001', {
          reason:
            'Saya ingin mengajukan banding karena karya saya murni manual dengan bukti file PSD terlampir.',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all appeals', async () => {
      appealsRepository.findAll.mockResolvedValue([mockAppeal] as any);

      const result = await service.findAll();
      expect(result).toEqual([mockAppeal]);
      expect(appealsRepository.findAll).toHaveBeenCalledWith({ status: undefined });
    });

    it('should return filtered appeals by status', async () => {
      appealsRepository.findAll.mockResolvedValue([mockAppeal] as any);

      const result = await service.findAll(AppealStatus.pending);
      expect(result).toEqual([mockAppeal]);
      expect(appealsRepository.findAll).toHaveBeenCalledWith({ status: AppealStatus.pending });
    });
  });

  describe('findMy', () => {
    it('should return artist appeals', async () => {
      appealsRepository.findByArtistId.mockResolvedValue([mockAppeal] as any);

      const result = await service.findMy('u-001');
      expect(result).toEqual([mockAppeal]);
      expect(appealsRepository.findByArtistId).toHaveBeenCalledWith('u-001');
    });
  });

  describe('findOne', () => {
    it('should return single appeal by id', async () => {
      appealsRepository.findById.mockResolvedValue(mockAppeal as any);

      const result = await service.findOne('app-001');
      expect(result).toEqual(mockAppeal);
    });

    it('should throw NotFoundException if appeal not found', async () => {
      appealsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolve', () => {
    it('should approve an appeal and reset artist strike count', async () => {
      appealsRepository.findById.mockResolvedValue(mockAppeal as any);
      appealsRepository.update.mockResolvedValue({
        ...mockAppeal,
        status: AppealStatus.approved,
        resolvedById: 'u-007',
        resolutionNotes: 'Bukti valid.',
      } as any);

      const result = await service.resolve('app-001', 'u-007', {
        approved: true,
        resolutionNotes: 'Bukti valid.',
      });

      expect(result.status).toBe(AppealStatus.approved);
      expect(appealsRepository.update).toHaveBeenCalledWith('app-001', {
        status: AppealStatus.approved,
        resolvedById: 'u-007',
        resolutionNotes: 'Bukti valid.',
      });
      expect(appealsRepository.resetArtistStrikeCount).toHaveBeenCalledWith('u-001');
    });

    it('should reject an appeal without resetting strike count', async () => {
      appealsRepository.findById.mockResolvedValue(mockAppeal as any);
      appealsRepository.update.mockResolvedValue({
        ...mockAppeal,
        status: AppealStatus.rejected,
        resolvedById: 'u-007',
        resolutionNotes: 'Bukti tidak memadai.',
      } as any);

      const result = await service.resolve('app-001', 'u-007', {
        approved: false,
        resolutionNotes: 'Bukti tidak memadai.',
      });

      expect(result.status).toBe(AppealStatus.rejected);
      expect(appealsRepository.resetArtistStrikeCount).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if appeal is already resolved', async () => {
      appealsRepository.findById.mockResolvedValue({
        ...mockAppeal,
        status: AppealStatus.approved,
      } as any);

      await expect(
        service.resolve('app-001', 'u-007', {
          approved: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if appeal not found for resolve', async () => {
      appealsRepository.findById.mockResolvedValue(null);

      await expect(
        service.resolve('non-existent', 'u-007', {
          approved: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
