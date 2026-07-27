import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../generated/prisma/enums';

export class ResolveReportDto {
  @IsEnum(ReportStatus, { message: 'Status laporan harus resolved atau dismissed.' })
  status: ReportStatus;
}
