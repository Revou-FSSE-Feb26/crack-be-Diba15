import { IsEnum } from 'class-validator';
import { DisputeStatus } from '../../generated/prisma/enums';

export class ResolveDisputeDto {
  @IsEnum(DisputeStatus, { message: 'Status keputusan sengketa harus approved atau rejected.' })
  status: DisputeStatus;
}
