import { Test, type TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<Partial<ReportsService>>;

  const mockReportResponse = {
    id: 'rep-001',
    reporter_id: 'u-005',
    target_type: 'artwork',
    target_id: 'a-001',
    reason: 'Karya diduga terdeteksi hasil AI.',
    status: 'pending',
    curator_id: null,
    artwork_id: 'a-001',
    created_at: '2024-08-10T10:00:00.000Z',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockReportResponse),
      findAll: jest.fn().mockResolvedValue([mockReportResponse]),
      findOne: jest.fn().mockResolvedValue(mockReportResponse),
      resolve: jest.fn().mockResolvedValue({
        ...mockReportResponse,
        status: 'resolved',
        curator_id: 'u-008',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call reportsService.create with correct params', async () => {
      const result = await controller.create('u-005', {
        artworkId: 'a-001',
        reason: 'Karya diduga terdeteksi hasil AI.',
      });

      expect(service.create).toHaveBeenCalledWith('u-005', {
        artworkId: 'a-001',
        reason: 'Karya diduga terdeteksi hasil AI.',
      });
      expect(result).toEqual(mockReportResponse);
    });
  });

  describe('findAll', () => {
    it('should call reportsService.findAll', async () => {
      const result = await controller.findAll('pending' as any);
      expect(service.findAll).toHaveBeenCalledWith('pending');
      expect(result).toEqual([mockReportResponse]);
    });
  });

  describe('resolve', () => {
    it('should call reportsService.resolve with curator id and dto', async () => {
      const result = await controller.resolve('rep-001', 'u-008', {
        status: 'resolved' as any,
      });

      expect(service.resolve).toHaveBeenCalledWith('rep-001', 'u-008', {
        status: 'resolved',
      });
      expect(result.status).toBe('resolved');
      expect(result.curator_id).toBe('u-008');
    });
  });
});
