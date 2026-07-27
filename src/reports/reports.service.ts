import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ReportStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReportDto } from './dto/create-report.dto';
import type { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private mapReportResponse(report: any) {
    if (!report) return null;
    return {
      id: report.id,
      reporter_id: report.reporterId,
      target_type: report.targetType,
      target_id: report.targetId,
      reason: report.reason,
      status: report.status,
      curator_id: report.curatorId || null,
      artwork_id: report.artworkId || null,
      created_at: report.createdAt.toISOString(),
      reporter: report.reporter
        ? {
            id: report.reporter.id,
            name: report.reporter.name,
            email: report.reporter.email,
            role: report.reporter.role,
          }
        : undefined,
      curator: report.curator
        ? {
            id: report.curator.id,
            name: report.curator.name,
            email: report.curator.email,
          }
        : undefined,
      artwork: report.artwork
        ? {
            id: report.artwork.id,
            title: report.artwork.title,
            images_url: report.artwork.imagesUrl,
            curation_status: report.artwork.curationStatus,
            artist_id: report.artwork.artistsId,
            artist: report.artwork.artist
              ? {
                  id: report.artwork.artist.id,
                  name: report.artwork.artist.name,
                  email: report.artwork.artist.email,
                  avatar_url: report.artwork.artist.profile?.avatarUrl || null,
                  strike_count: report.artwork.artist.profile?.strikeCount || 0,
                }
              : undefined,
          }
        : undefined,
    };
  }

  async create(reporterId: string, dto: CreateReportDto) {
    const { artworkId, reason, targetType } = dto;

    const artwork = await this.prisma.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      throw new NotFoundException('Artwork yang dilaporkan tidak ditemukan.');
    }

    const report = await this.reportsRepository.createReport(
      reporterId,
      artworkId,
      reason,
      targetType || 'artwork',
    );

    return this.mapReportResponse(report);
  }

  async findAll(status?: ReportStatus) {
    const reports = await this.reportsRepository.findAllReports(status);
    return reports.map((r) => this.mapReportResponse(r));
  }

  async findOne(id: string) {
    const report = await this.reportsRepository.findReportById(id);
    if (!report) {
      throw new NotFoundException('Laporan tidak ditemukan.');
    }
    return this.mapReportResponse(report);
  }

  async resolve(id: string, curatorId: string, dto: ResolveReportDto) {
    const existing = await this.reportsRepository.findReportById(id);

    if (!existing) {
      throw new NotFoundException('Laporan tidak ditemukan.');
    }

    if (existing.status !== 'pending') {
      throw new BadRequestException(
        `Laporan ini sudah diproses dengan status "${existing.status}".`,
      );
    }

    if (dto.status === 'pending') {
      throw new BadRequestException('Status keputusan harus "resolved" atau "dismissed".');
    }

    const updated = await this.reportsRepository.resolveReport(id, curatorId, dto.status);
    return this.mapReportResponse(updated);
  }
}
