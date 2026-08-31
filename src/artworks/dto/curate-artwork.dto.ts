import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurationStatus } from '../../generated/prisma/enums';

export class CurateArtworkDto {
  @ApiProperty({
    enum: CurationStatus,
    example: CurationStatus.approved,
    description: 'Status kurasi karya (approved, rejected, flagged)',
  })
  @IsEnum(CurationStatus, { message: 'Status kurasi tidak valid.' })
  curationStatus: CurationStatus;

  @ApiPropertyOptional({
    example: 'Karya terdeteksi menggunakan AI generator tanpa bukti WIP yang memadai.',
    description: 'Alasan penolakan jika karya di-reject',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
