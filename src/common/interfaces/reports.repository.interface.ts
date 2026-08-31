import type { ReportStatus, ReportTargetType } from '../../generated/prisma/enums';

export interface ReportsRepositoryInterface {
  createReport(
    reporterId: string,
    artworkId: string,
    reason: string,
    targetType?: ReportTargetType,
  ): Promise<any>;
  findAllReports(status?: ReportStatus): Promise<any[]>;
  findReportById(id: string): Promise<any | null>;
  resolveReport(id: string, curatorId: string, status: ReportStatus): Promise<any>;
  findArtworkById(id: string): Promise<any | null>;
}
