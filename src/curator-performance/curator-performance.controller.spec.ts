import { Test, type TestingModule } from '@nestjs/testing';
import { CuratorPerformanceController } from './curator-performance.controller';
import { CuratorPerformanceService } from './curator-performance.service';
import type { CuratorPerformanceQueryDto } from './dto/curator-performance-query.dto';

describe('CuratorPerformanceController', () => {
  let controller: CuratorPerformanceController;
  let service: jest.Mocked<Partial<CuratorPerformanceService>>;

  const mockResponse = {
    summary: {
      total_curators: 2,
      total_artworks_reviewed: 10,
      total_artworks_approved: 8,
      total_artworks_rejected: 2,
      overall_approval_rate: 80,
      total_disputes_resolved: 3,
      total_reports_resolved: 4,
      total_moderation_actions: 17,
      average_response_time_minutes: 35,
    },
    curators: [
      {
        id: 'u-008',
        name: 'Dimas Kurator',
        email: 'curator@trubrush.com',
        role: 'curator',
        avatar_url: null,
        artworks_reviewed: 10,
        artworks_approved: 8,
        artworks_rejected: 2,
        approval_rate: 80,
        disputes_resolved: 3,
        reports_resolved: 4,
        total_actions: 17,
        avg_response_time_minutes: 35,
        last_active_at: '2026-08-25T10:00:00.000Z',
      },
    ],
  };

  beforeEach(async () => {
    service = {
      getPerformanceMetrics: jest.fn().mockResolvedValue(mockResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuratorPerformanceController],
      providers: [
        {
          provide: CuratorPerformanceService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CuratorPerformanceController>(CuratorPerformanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPerformanceMetrics', () => {
    it('should call service.getPerformanceMetrics with query dto', async () => {
      const query: CuratorPerformanceQueryDto = {
        search: 'dimas',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.999Z',
      };

      const result = await controller.getPerformanceMetrics(query);

      expect(service.getPerformanceMetrics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });
});
