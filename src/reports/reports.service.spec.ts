import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportsRepository: jest.Mocked<Partial<ReportsRepository>>;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockReport = {
    id: 'rep-001',
    reporterId: 'u-005', // Dimas Prasetyo (Client)
    targetType: 'artwork' as const,
    targetId: 'a-001', // Senja di Tepi Sungai Ciliwung
    reason: 'Karya diduga terdeteksi hasil AI tanpa atribusi.',
    status: 'pending' as const,
    curatorId: null,
    artworkId: 'a-001',
    createdAt: new Date('2024-08-10T10:00:00Z'),
    reporter: {
      id: 'u-005',
      name: 'Dimas Prasetyo',
      email: 'dimas@example.com',
      role: 'client',
    },
    curator: null,
    artwork: {
      id: 'a-001',
      title: 'Senja di Tepi Sungai Ciliwung',
      imagesUrl: ['https://picsum.photos/seed/ciliwung/800/600'],
      curationStatus: 'approved',
      artistsId: 'u-001', // Ari Ramadan (Artist)
      artist: {
        id: 'u-001',
        name: 'Ari Ramadan',
        email: 'ari@example.com',
        profile: {
          id: 'p-001',
          avatarUrl: null,
          strikeCount: 0,
        },
      },
    },
  };

  beforeEach(async () => {
    reportsRepository = {
      createReport: jest.fn(),
      findAllReports: jest.fn(),
      findReportById: jest.fn(),
      resolveReport: jest.fn(),
    };

    prismaService = {
      artwork: {
        findUnique: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: reportsRepository },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report successfully', async () => {
      const findUniqueMock = (prismaService.artwork as any).findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue({
        id: 'a-001',
      });
      (reportsRepository.createReport as jest.Mock).mockResolvedValue(mockReport);

      const result = await service.create('u-005', {
        artworkId: 'a-001',
        reason: 'Karya diduga terdeteksi hasil AI tanpa atribusi.',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('rep-001');
      expect(result?.reporter_id).toBe('u-005');
      expect(result?.artwork_id).toBe('a-001');
    });

    it('should throw NotFoundException if artwork does not exist', async () => {
      const findUniqueMock = (prismaService.artwork as any).findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue(null);

      await expect(
        service.create('u-005', {
          artworkId: 'a-non-existent',
          reason: 'Alasan tes',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return list of mapped reports', async () => {
      (reportsRepository.findAllReports as jest.Mock).mockResolvedValue([mockReport]);

      const results = await service.findAll();
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('rep-001');
      expect(results[0]?.status).toBe('pending');
    });
  });

  describe('resolve', () => {
    it('should resolve a pending report and return updated report', async () => {
      (reportsRepository.findReportById as jest.Mock).mockResolvedValue(mockReport);
      const resolvedMockReport = {
        ...mockReport,
        status: 'resolved' as const,
        curatorId: 'u-008', // Hendra Kurniawan (Curator)
        curator: {
          id: 'u-008',
          name: 'Hendra Kurniawan',
          email: 'hendra@trubrush.com',
        },
      };
      (reportsRepository.resolveReport as jest.Mock).mockResolvedValue(resolvedMockReport);

      const result = await service.resolve('rep-001', 'u-008', {
        status: 'resolved',
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe('resolved');
      expect(result?.curator_id).toBe('u-008');
    });

    it('should throw BadRequestException if report is already resolved/dismissed', async () => {
      (reportsRepository.findReportById as jest.Mock).mockResolvedValue({
        ...mockReport,
        status: 'resolved',
      });

      await expect(service.resolve('rep-001', 'u-008', { status: 'dismissed' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
