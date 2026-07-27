import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReportRepository } from './report.repository';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let reportRepository: jest.Mocked<Partial<ReportRepository>>;
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
    reportRepository = {
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
        ReportService,
        { provide: ReportRepository, useValue: reportRepository },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  // Test: Memastikan ReportService berhasil diinisialisasi
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    // Test: Membuat laporan dengan data yang valid
    it('should create a report successfully', async () => {
      const findUniqueMock = (prismaService.artwork as any).findUnique as jest.Mock;
      findUniqueMock.mockResolvedValue({
        id: 'a-001',
      });
      (reportRepository.createReport as jest.Mock).mockResolvedValue(mockReport);

      const result = await service.create('u-005', {
        artworkId: 'a-001',
        reason: 'Karya diduga terdeteksi hasil AI tanpa atribusi.',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('rep-001');
      expect(result?.reporter_id).toBe('u-005');
      expect(result?.artwork_id).toBe('a-001');
    });

    // Test: Melempar NotFoundException jika artwork yang dilaporkan tidak ditemukan
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
    // Test: Mengambil daftar semua laporan dan memverifikasi data ter-map dengan benar
    it('should return list of mapped reports', async () => {
      (reportRepository.findAllReports as jest.Mock).mockResolvedValue([mockReport]);

      const results = await service.findAll();
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('rep-001');
      expect(results[0]?.status).toBe('pending');
    });
  });

  describe('resolve', () => {
    // Test: Menutup laporan pending dengan status resolved dan curator assignment
    it('should resolve a pending report and return updated report', async () => {
      (reportRepository.findReportById as jest.Mock).mockResolvedValue(mockReport);
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
      (reportRepository.resolveReport as jest.Mock).mockResolvedValue(resolvedMockReport);

      const result = await service.resolve('rep-001', 'u-008', {
        status: 'resolved',
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe('resolved');
      expect(result?.curator_id).toBe('u-008');
    });

    // Test: Melempar BadRequestException jika mencoba menutup laporan yang sudah resolved/dismissed
    it('should throw BadRequestException if report is already resolved/dismissed', async () => {
      (reportRepository.findReportById as jest.Mock).mockResolvedValue({
        ...mockReport,
        status: 'resolved',
      });

      await expect(service.resolve('rep-001', 'u-008', { status: 'dismissed' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
