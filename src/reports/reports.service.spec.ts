import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportsRepository: jest.Mocked<Partial<ReportsRepository>>;

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
      findArtworkById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: ReportsRepository, useValue: reportsRepository }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a report successfully', async () => {
      (reportsRepository.findArtworkById as jest.Mock).mockResolvedValue({
        id: 'a-001',
        title: 'Senja di Tepi Sungai Ciliwung',
      });
      (reportsRepository.createReport as jest.Mock).mockResolvedValue(mockReport);

      const result = await service.create('u-005', {
        artworkId: 'a-001',
        reason: 'Karya diduga terdeteksi hasil AI tanpa atribusi.',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('rep-001');
      expect(result?.status).toBe('pending');
    });

    it('should throw NotFoundException if artwork not found', async () => {
      (reportsRepository.findArtworkById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create('u-005', {
          artworkId: 'non-existent-id',
          reason: 'Laporan dummy',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return list of reports', async () => {
      (reportsRepository.findAllReports as jest.Mock).mockResolvedValue([mockReport]);

      const results = await service.findAll();
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('rep-001');
    });
  });

  describe('resolve', () => {
    it('should resolve report as approved (strike to artist)', async () => {
      (reportsRepository.findReportById as jest.Mock).mockResolvedValue(mockReport);
      (reportsRepository.resolveReport as jest.Mock).mockResolvedValue({
        ...mockReport,
        status: 'approved',
        curatorId: 'u-008',
      });

      const result = await service.resolve('rep-001', 'u-008', { status: 'approved' });
      expect(result?.status).toBe('approved');
      expect(result?.curator_id).toBe('u-008');
    });

    it('should throw BadRequestException if report already resolved', async () => {
      (reportsRepository.findReportById as jest.Mock).mockResolvedValue({
        ...mockReport,
        status: 'approved',
        curatorId: 'u-008',
      });

      await expect(service.resolve('rep-001', 'u-008', { status: 'approved' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
