import { Test, type TestingModule } from '@nestjs/testing';
import { CuratorPerformanceRepository } from './curator-performance.repository';
import { CuratorPerformanceService } from './curator-performance.service';

describe('CuratorPerformanceService', () => {
  let service: CuratorPerformanceService;
  let repository: jest.Mocked<Partial<CuratorPerformanceRepository>>;

  const mockCurators = [
    {
      id: 'u-008',
      name: 'Dimas Kurator',
      email: 'curator@trubrush.com',
      role: 'curator',
      profile: {
        avatarUrl: 'https://example.com/avatar.jpg',
        isVerified: true,
      },
    },
    {
      id: 'u-009',
      name: 'Budi Reviewer',
      email: 'budi.curator@trubrush.com',
      role: 'curator',
      profile: {
        avatarUrl: null,
        isVerified: false,
      },
    },
  ];

  const mockArtworks = [
    {
      id: 'a-001',
      title: 'Neon Samurai',
      curationStatus: 'approved',
      reviewedBy: 'u-008',
      reviewedAt: new Date('2026-08-20T10:30:00Z'),
      createdAt: new Date('2026-08-20T10:00:00Z'), // 30 minutes duration
    },
    {
      id: 'a-002',
      title: 'Cyber Geisha',
      curationStatus: 'rejected',
      reviewedBy: 'u-008',
      reviewedAt: new Date('2026-08-21T11:00:00Z'),
      createdAt: new Date('2026-08-21T10:00:00Z'), // 60 minutes duration
    },
  ];

  const mockDisputes = [
    {
      id: 'd-001',
      mediatorId: 'u-008',
      status: 'approved',
      createdAt: new Date('2026-08-22T14:00:00Z'),
    },
  ];

  const mockReports = [
    {
      id: 'r-001',
      curatorId: 'u-008',
      status: 'resolved',
      createdAt: new Date('2026-08-23T15:00:00Z'),
    },
  ];

  beforeEach(async () => {
    repository = {
      getRawPerformanceData: jest.fn().mockResolvedValue({
        curators: mockCurators,
        artworks: mockArtworks,
        disputes: mockDisputes,
        reports: mockReports,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuratorPerformanceService,
        {
          provide: CuratorPerformanceRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CuratorPerformanceService>(CuratorPerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPerformanceMetrics', () => {
    it('should correctly calculate summary and curator metrics', async () => {
      const result = await service.getPerformanceMetrics({});

      expect(repository.getRawPerformanceData).toHaveBeenCalled();

      // Check Summary
      expect(result.summary.total_curators).toBe(2);
      expect(result.summary.total_artworks_reviewed).toBe(2);
      expect(result.summary.total_artworks_approved).toBe(1);
      expect(result.summary.total_artworks_rejected).toBe(1);
      expect(result.summary.overall_approval_rate).toBe(50);
      expect(result.summary.total_disputes_resolved).toBe(1);
      expect(result.summary.total_reports_resolved).toBe(1);
      expect(result.summary.total_moderation_actions).toBe(4);
      expect(result.summary.average_response_time_minutes).toBe(45); // (30 + 60) / 2 = 45 min

      // Check Top Curator u-008
      const topCurator = result.curators.find((c) => c.id === 'u-008');
      expect(topCurator).toBeDefined();
      expect(topCurator?.artworks_reviewed).toBe(2);
      expect(topCurator?.artworks_approved).toBe(1);
      expect(topCurator?.artworks_rejected).toBe(1);
      expect(topCurator?.approval_rate).toBe(50);
      expect(topCurator?.disputes_resolved).toBe(1);
      expect(topCurator?.reports_resolved).toBe(1);
      expect(topCurator?.total_actions).toBe(4);
      expect(topCurator?.avg_response_time_minutes).toBe(45);
      expect(topCurator?.last_active_at).toBe(new Date('2026-08-23T15:00:00Z').toISOString());
    });

    it('should filter curators by search query', async () => {
      const result = await service.getPerformanceMetrics({ search: 'dimas' });

      expect(result.curators).toHaveLength(1);
      expect(result.curators[0].name).toBe('Dimas Kurator');
    });
  });
});
