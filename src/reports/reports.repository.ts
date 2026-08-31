import { Injectable } from '@nestjs/common';
import type { ReportsRepositoryInterface } from '../common/interfaces/reports.repository.interface';
import type { ReportStatus, ReportTargetType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const reportWithRelationsSelect = {
  include: {
    reporter: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    curator: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    artwork: {
      select: {
        id: true,
        title: true,
        imagesUrl: true,
        curationStatus: true,
        artistsId: true,
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                id: true,
                avatarUrl: true,
                strikeCount: true,
              },
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class ReportsRepository implements ReportsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(
    reporterId: string,
    artworkId: string,
    reason: string,
    targetType: ReportTargetType = 'artwork',
  ) {
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId: artworkId,
        artworkId,
        reason,
        status: 'pending',
      },
      ...reportWithRelationsSelect,
    });
  }

  async findAllReports(status?: ReportStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.report.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      ...reportWithRelationsSelect,
    });
  }

  async findReportById(id: string) {
    return this.prisma.report.findUnique({
      where: { id },
      ...reportWithRelationsSelect,
    });
  }

  async resolveReport(id: string, curatorId: string, status: ReportStatus) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id },
        include: {
          artwork: {
            select: {
              artistsId: true,
            },
          },
        },
      });

      if (!report) return null;

      const updatedReport = await tx.report.update({
        where: { id },
        data: {
          status,
          curatorId,
        },
        ...reportWithRelationsSelect,
      });

      if (status === 'resolved') {
        const targetArtworkId = report.artworkId || report.targetId;
        if (targetArtworkId) {
          await tx.artwork.update({
            where: { id: targetArtworkId },
            data: {
              isVisibleOnFeed: false,
              curationStatus: 'flagged',
            },
          });
        }

        if (report.artwork?.artistsId) {
          const artistId = report.artwork.artistsId;
          await tx.profile.update({
            where: { userId: artistId },
            data: {
              strikeCount: {
                increment: 1,
              },
            },
          });
        }
      }

      return updatedReport;
    });
  }

  async findArtworkById(id: string) {
    return this.prisma.artwork.findUnique({
      where: { id },
    });
  }
}
