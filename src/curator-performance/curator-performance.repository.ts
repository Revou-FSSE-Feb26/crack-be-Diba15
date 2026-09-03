import { Injectable } from '@nestjs/common';
import type {
  CuratorPerformanceFilter,
  CuratorPerformanceRawData,
  CuratorPerformanceRepositoryInterface,
} from '../common/interfaces/curator-performance.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Class Repository untuk handle logic data curator performance
 * Meng-implementasi dari interface CuratorPerformanceRepositoryInterface
 */
@Injectable()
export class CuratorPerformanceRepository implements CuratorPerformanceRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async getRawPerformanceData(
    filter?: CuratorPerformanceFilter,
  ): Promise<CuratorPerformanceRawData> {
    const { startDate, endDate } = filter || {};

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [curators, artworks, disputes, reports] = await Promise.all([
      // 1. Dapatkan seluruh akun Kurator dan Admin
      this.prisma.user.findMany({
        where: {
          role: { in: ['curator', 'admin'] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),

      // 2. Dapatkan seluruh karya seni yang telah ditinjau
      this.prisma.artwork.findMany({
        where: {
          reviewedBy: { not: null },
          curationStatus: { in: ['approved', 'rejected'] },
          ...(hasDateFilter ? { reviewedAt: dateFilter } : {}),
        },
        select: {
          id: true,
          title: true,
          curationStatus: true,
          reviewedBy: true,
          reviewedAt: true,
          createdAt: true,
        },
      }),

      // 3. Dapatkan seluruh sengketa yang telah diselesaikan
      this.prisma.disputeLog.findMany({
        where: {
          mediatorId: { not: null },
          status: { in: ['approved', 'rejected'] },
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: {
          id: true,
          mediatorId: true,
          status: true,
          createdAt: true,
        },
      }),

      // 4. Dapatkan seluruh laporan yang telah ditindaklanjuti
      this.prisma.report.findMany({
        where: {
          curatorId: { not: null },
          status: { in: ['resolved', 'dismissed'] },
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: {
          id: true,
          curatorId: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      curators,
      artworks,
      disputes,
      reports,
    };
  }
}
