import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppealStatus } from '../../generated/prisma/enums';

class AppealUserSummaryDto {
  @ApiProperty({ example: 'u-001' })
  id: string;

  @ApiProperty({ example: 'Ari Ramadan' })
  name: string;

  @ApiProperty({ example: 'ari@example.com' })
  email: string;

  @ApiProperty({ example: 'artist' })
  role: string;
}

export class AppealResponseDto {
  @ApiProperty({ example: 'app-uuid-1234' })
  id: string;

  @ApiProperty({ example: 'u-001' })
  artistId: string;

  @ApiProperty({ example: 'Saya ingin mengajukan banding karena karya saya murni manual...' })
  reason: string;

  @ApiProperty({ enum: AppealStatus, example: AppealStatus.pending })
  status: AppealStatus;

  @ApiPropertyOptional({ example: 'u-007' })
  resolvedById?: string | null;

  @ApiPropertyOptional({ example: 'Banding diterima, strike di-reset.' })
  resolutionNotes?: string | null;

  @ApiProperty({ example: '2026-08-29T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-29T08:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: AppealUserSummaryDto })
  artist?: AppealUserSummaryDto;

  @ApiPropertyOptional({ type: AppealUserSummaryDto })
  resolvedBy?: AppealUserSummaryDto | null;
}
