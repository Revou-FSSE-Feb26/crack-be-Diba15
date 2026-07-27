import { IsEnum } from 'class-validator';
import { CommissionStatus } from '../../generated/prisma/enums';

export class RespondCommissionDto {
  @IsEnum(CommissionStatus, { message: 'Status tanggapan harus accepted atau cancelled.' })
  status: CommissionStatus;
}
