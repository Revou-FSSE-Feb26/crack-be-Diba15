import { Injectable } from '@nestjs/common';
import type {
  AuditLogFilterInput,
  AuditLogItemResult,
  AuditLogsRepositoryInterface,
} from '../common/interfaces/audit-logs.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Class Repository untuk handle logic data audit logs
 * Meng-implementasi dari interface AuditLogsRepositoryInterface
 */
@Injectable()
export class AuditLogsRepository implements AuditLogsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: AuditLogFilterInput = {}) {
    const { category = 'all', search, startDate, endDate, page = 1, limit = 10 } = filter;

    const shouldFetchCuration = category === 'all' || category === 'curation';
    const shouldFetchReport = category === 'all' || category === 'report';
    const shouldFetchDispute = category === 'all' || category === 'dispute';
    const shouldFetchAppeal = category === 'all' || category === 'appeal';

    // Mengambil data dari keempat tabel sekaligus menggunakan Promise.all agar lebih efisien
    const [artworks, reports, disputes, appeals] = await Promise.all([
      shouldFetchCuration
        ? this.prisma.artwork.findMany({
            where: {
              curationStatus: { in: ['approved', 'rejected', 'flagged'] },
              reviewedBy: { not: null },
            },
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              artist: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        : [],
      shouldFetchReport
        ? this.prisma.report.findMany({
            where: {
              status: { in: ['resolved', 'dismissed'] },
              curatorId: { not: null },
            },
            include: {
              curator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              artwork: {
                select: {
                  id: true,
                  title: true,
                },
              },
              reporter: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        : [],
      shouldFetchDispute
        ? this.prisma.disputeLog.findMany({
            where: {
              status: { in: ['approved', 'rejected'] },
              mediatorId: { not: null },
            },
            include: {
              mediator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              commission: {
                select: {
                  id: true,
                  commissionTitle: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        : [],
      shouldFetchAppeal
        ? this.prisma.appeal.findMany({
            where: {
              status: { in: ['approved', 'rejected'] },
              resolvedById: { not: null },
            },
            include: {
              resolvedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              artist: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        : [],
    ]);

    const logs: AuditLogItemResult[] = [];

    // 1. Curation Logs
    for (const art of artworks) {
      if (!art.reviewer) continue;
      logs.push({
        id: `audit-cur-${art.id}`,
        category: 'curation',
        action:
          art.curationStatus === 'approved'
            ? 'Persetujuan Artwork'
            : art.curationStatus === 'rejected'
              ? 'Penolakan Artwork'
              : 'Penandaan Artwork (Flagged)',
        actor: art.reviewer,
        targetType: 'artwork',
        targetId: art.id,
        targetTitle: art.title,
        details:
          art.rejectionReason ||
          (art.curationStatus === 'approved'
            ? 'Artwork lolos verifikasi keaslian manual anti-AI.'
            : 'Artwork ditandai kurator untuk peninjauan lebih lanjut.'),
        status: art.curationStatus,
        createdAt: art.reviewedAt || art.createdAt,
      });
    }

    // 2. Report Logs
    for (const rep of reports) {
      if (!rep.curator) continue;
      logs.push({
        id: `audit-rep-${rep.id}`,
        category: 'report',
        action:
          rep.status === 'resolved'
            ? 'Resolusi Laporan Pelanggaran'
            : 'Laporan Pelanggaran Diabaikan (Dismissed)',
        actor: rep.curator,
        targetType: rep.targetType,
        targetId: rep.targetId,
        targetTitle: rep.artwork ? rep.artwork.title : `Target ID: ${rep.targetId}`,
        details: rep.reason,
        status: rep.status,
        createdAt: rep.createdAt,
      });
    }

    // 3. Dispute Logs
    for (const disp of disputes) {
      if (!disp.mediator) continue;
      logs.push({
        id: `audit-disp-${disp.id}`,
        category: 'dispute',
        action:
          disp.status === 'approved' ? 'Mediasi Dispute Disetujui' : 'Mediasi Dispute Ditolak',
        actor: disp.mediator,
        targetType: 'commission',
        targetId: disp.commissionId,
        targetTitle: disp.commission ? disp.commission.commissionTitle : disp.commissionId,
        details: disp.reason,
        status: disp.status,
        createdAt: disp.createdAt,
      });
    }

    // 4. Appeal Logs
    for (const app of appeals) {
      if (!app.resolvedBy) continue;
      logs.push({
        id: `audit-app-${app.id}`,
        category: 'appeal',
        action:
          app.status === 'approved'
            ? 'Persetujuan Banding Akun (Strike Reset)'
            : 'Penolakan Banding Akun',
        actor: app.resolvedBy,
        targetType: 'user',
        targetId: app.artistId,
        targetTitle: app.artist ? app.artist.name : app.artistId,
        details: app.resolutionNotes || app.reason,
        status: app.status,
        createdAt: app.updatedAt || app.createdAt,
      });
    }

    // Sort by createdAt descending
    let filteredLogs = logs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Apply date range filters
    if (startDate) {
      const start = new Date(startDate).getTime();
      filteredLogs = filteredLogs.filter((l) => new Date(l.createdAt).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      filteredLogs = filteredLogs.filter((l) => new Date(l.createdAt).getTime() <= end);
    }

    // Apply text search
    if (search?.trim()) {
      const q = search.toLowerCase().trim();
      filteredLogs = filteredLogs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.actor.name.toLowerCase().includes(q) ||
          l.actor.email.toLowerCase().includes(q) ||
          (l.targetTitle?.toLowerCase().includes(q) ?? false) ||
          (l.details?.toLowerCase().includes(q) ?? false) ||
          l.targetId.toLowerCase().includes(q),
      );
    }

    const total = filteredLogs.length;
    const paginated = filteredLogs.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
    };
  }
}
