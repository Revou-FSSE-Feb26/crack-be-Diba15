import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from '../../generated/prisma/enums';

export class ResolveReportDto {
  @ApiProperty({
    enum: ReportStatus,
    example: ReportStatus.resolved,
    description: 'Status penanganan laporan (resolved atau dismissed)',
  })
  @IsEnum(ReportStatus, { message: 'Status laporan harus resolved atau dismissed.' })
  status: ReportStatus;
}
