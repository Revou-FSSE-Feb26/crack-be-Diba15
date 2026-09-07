import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { HealthResponseDto } from './dto/health-response.dto';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check(): Promise<HealthResponseDto> {
    const isDbHealthy = await this.healthRepository.pingDatabase();

    if (!isDbHealthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    };
  }
}
