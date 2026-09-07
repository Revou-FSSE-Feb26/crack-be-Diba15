import { ServiceUnavailableException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let healthRepository: jest.Mocked<Partial<HealthRepository>>;

  beforeEach(async () => {
    healthRepository = {
      pingDatabase: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: HealthRepository, useValue: healthRepository }],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database ping succeeds', async () => {
      (healthRepository.pingDatabase as jest.Mock).mockResolvedValue(true);

      const result = await service.check();

      expect(healthRepository.pingDatabase).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(typeof result.uptime).toBe('number');
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should throw ServiceUnavailableException when database ping fails', async () => {
      (healthRepository.pingDatabase as jest.Mock).mockResolvedValue(false);

      await expect(service.check()).rejects.toThrow(ServiceUnavailableException);
      expect(healthRepository.pingDatabase).toHaveBeenCalledTimes(1);
    });
  });
});
