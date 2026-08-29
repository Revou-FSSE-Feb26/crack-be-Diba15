import { Injectable } from '@nestjs/common';
import { CuratorPerformanceRepository } from './curator-performance.repository';
import type { CuratorPerformanceQueryDto } from './dto/curator-performance-query.dto';

export interface CuratorMetricItem {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  artworks_reviewed: number;
  artworks_approved: number;
  artworks_rejected: number;
  approval_rate: number;
  disputes_resolved: number;
  reports_resolved: number;
  total_actions: number;
  avg_response_time_minutes: number;
  last_active_at: string | null;
}

export interface CuratorPerformanceSummary {
  total_curators: number;
  total_artworks_reviewed: number;
  total_artworks_approved: number;
  total_artworks_rejected: number;
  overall_approval_rate: number;
  total_disputes_resolved: number;
  total_reports_resolved: number;
  total_moderation_actions: number;
  average_response_time_minutes: number;
}

export interface CuratorPerformanceResponse {
  summary: CuratorPerformanceSummary;
  curators: CuratorMetricItem[];
}

@Injectable()
export class CuratorPerformanceService {
  constructor(private readonly repository: CuratorPerformanceRepository) {}

  async getPerformanceMetrics(
    query: CuratorPerformanceQueryDto = {},
  ): Promise<CuratorPerformanceResponse> {
    const rawData = await this.repository.getRawPerformanceData({
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const { curators, artworks, disputes, reports } = rawData;

    // 1. Hitung metrik per kurator
    const curatorMetrics: CuratorMetricItem[] = curators.map((curator) => {
      const curatorArtworks = artworks.filter((a) => a.reviewedBy === curator.id);
      const artworksApproved = curatorArtworks.filter(
        (a) => a.curationStatus === 'approved',
      ).length;
      const artworksRejected = curatorArtworks.filter(
        (a) => a.curationStatus === 'rejected',
      ).length;
      const artworksReviewed = curatorArtworks.length;

      const approvalRate =
        artworksReviewed > 0 ? Math.round((artworksApproved / artworksReviewed) * 1000) / 10 : 100;

      const curatorDisputes = disputes.filter((d) => d.mediatorId === curator.id);
      const curatorReports = reports.filter((r) => r.curatorId === curator.id);

      const disputesResolved = curatorDisputes.length;
      const reportsResolved = curatorReports.length;
      const totalActions = artworksReviewed + disputesResolved + reportsResolved;

      // Kalkulasi waktu respons rata-rata (SLA) dalam menit
      let totalDurationMinutes = 0;
      let timedArtworksCount = 0;

      for (const item of curatorArtworks) {
        if (item.reviewedAt && item.createdAt) {
          const diffMinutes =
            (new Date(item.reviewedAt).getTime() - new Date(item.createdAt).getTime()) /
            (1000 * 60);
          if (diffMinutes >= 0) {
            totalDurationMinutes += diffMinutes;
            timedArtworksCount += 1;
          }
        }
      }

      const avgResponseTimeMinutes =
        timedArtworksCount > 0 ? Math.round(totalDurationMinutes / timedArtworksCount) : 0;

      // Tentukan aktivitas terakhir
      const allTimestamps: number[] = [
        ...curatorArtworks.map((a) => new Date(a.reviewedAt || a.createdAt).getTime()),
        ...curatorDisputes.map((d) => new Date(d.createdAt).getTime()),
        ...curatorReports.map((r) => new Date(r.createdAt).getTime()),
      ].filter((ts) => !Number.isNaN(ts));

      const lastActiveTimestamp = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null;

      return {
        id: curator.id,
        name: curator.name,
        email: curator.email,
        role: curator.role,
        avatar_url: curator.profile?.avatarUrl || null,
        artworks_reviewed: artworksReviewed,
        artworks_approved: artworksApproved,
        artworks_rejected: artworksRejected,
        approval_rate: approvalRate,
        disputes_resolved: disputesResolved,
        reports_resolved: reportsResolved,
        total_actions: totalActions,
        avg_response_time_minutes: avgResponseTimeMinutes,
        last_active_at: lastActiveTimestamp ? new Date(lastActiveTimestamp).toISOString() : null,
      };
    });

    // 2. Hitung ringkasan global platform
    const totalArtworksReviewed = artworks.length;
    const totalArtworksApproved = artworks.filter((a) => a.curationStatus === 'approved').length;
    const totalArtworksRejected = artworks.filter((a) => a.curationStatus === 'rejected').length;
    const overallApprovalRate =
      totalArtworksReviewed > 0
        ? Math.round((totalArtworksApproved / totalArtworksReviewed) * 1000) / 10
        : 100;

    const totalDisputesResolved = disputes.length;
    const totalReportsResolved = reports.length;
    const totalModerationActions =
      totalArtworksReviewed + totalDisputesResolved + totalReportsResolved;

    let globalTotalDuration = 0;
    let globalTimedCount = 0;

    for (const item of artworks) {
      if (item.reviewedAt && item.createdAt) {
        const diffMinutes =
          (new Date(item.reviewedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 60);
        if (diffMinutes >= 0) {
          globalTotalDuration += diffMinutes;
          globalTimedCount += 1;
        }
      }
    }

    const averageResponseTimeMinutes =
      globalTimedCount > 0 ? Math.round(globalTotalDuration / globalTimedCount) : 0;

    const summary: CuratorPerformanceSummary = {
      total_curators: curators.length,
      total_artworks_reviewed: totalArtworksReviewed,
      total_artworks_approved: totalArtworksApproved,
      total_artworks_rejected: totalArtworksRejected,
      overall_approval_rate: overallApprovalRate,
      total_disputes_resolved: totalDisputesResolved,
      total_reports_resolved: totalReportsResolved,
      total_moderation_actions: totalModerationActions,
      average_response_time_minutes: averageResponseTimeMinutes,
    };

    // 3. Filter pencarian kurator jika query `search` diberikan
    let filteredCurators = curatorMetrics;
    if (query.search) {
      const searchLower = query.search.trim().toLowerCase();
      filteredCurators = filteredCurators.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) || c.email.toLowerCase().includes(searchLower),
      );
    }

    // Urutkan berdasarkan total aksi terbanyak lalu karya terbanyak
    filteredCurators.sort(
      (a, b) => b.total_actions - a.total_actions || b.artworks_reviewed - a.artworks_reviewed,
    );

    return {
      summary,
      curators: filteredCurators,
    };
  }
}
