import { Injectable } from '@nestjs/common';
import type { HealthRepositoryInterface } from '../common/interfaces/health.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthRepository implements HealthRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async pingDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
