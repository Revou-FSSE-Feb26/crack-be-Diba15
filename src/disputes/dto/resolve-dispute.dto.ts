import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DisputeStatus } from '../../generated/prisma/enums';

export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeStatus,
    example: DisputeStatus.approved,
    description:
      'Keputusan mediator sengketa (approved untuk refund ke client, rejected jika memenangkan artis)',
  })
  @IsEnum(DisputeStatus, { message: 'Status keputusan sengketa harus approved atau rejected.' })
  status: DisputeStatus;
}
