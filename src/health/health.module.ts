import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService, HealthRepository],
})
export class HealthModule {}
