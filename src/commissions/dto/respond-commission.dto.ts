import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CommissionStatus } from '../../generated/prisma/enums';

export class RespondCommissionDto {
  @ApiProperty({
    enum: CommissionStatus,
    example: CommissionStatus.in_progress,
    description:
      'Status respons tanggapan artis (in_progress untuk menerima, rejected untuk menolak)',
  })
  @IsEnum(CommissionStatus, { message: 'Status tanggapan harus accepted atau cancelled.' })
  status: CommissionStatus;
}
