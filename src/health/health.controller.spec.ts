import { Test, type TestingModule } from '@nestjs/testing';
import type { HealthResponseDto } from './dto/health-response.dto';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<Partial<HealthService>>;

  const mockHealthResponse: HealthResponseDto = {
    status: 'ok',
    timestamp: '2026-09-07T04:20:00.000Z',
    uptime: 100.5,
    database: 'connected',
  };

  beforeEach(async () => {
    healthService = {
      check: jest.fn().mockResolvedValue(mockHealthResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status dto from HealthService', async () => {
      const result = await controller.check();

      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHealthResponse);
    });
  });
});
