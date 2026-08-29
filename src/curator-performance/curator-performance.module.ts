import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CuratorPerformanceController } from './curator-performance.controller';
import { CuratorPerformanceRepository } from './curator-performance.repository';
import { CuratorPerformanceService } from './curator-performance.service';

@Module({
  imports: [PrismaModule],
  controllers: [CuratorPerformanceController],
  providers: [CuratorPerformanceService, CuratorPerformanceRepository],
  exports: [CuratorPerformanceService, CuratorPerformanceRepository],
})
export class CuratorPerformanceModule {}
