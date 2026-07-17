import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurationStatus } from '../../generated/prisma/enums.js';

export class CurateArtworkDto {
  @IsEnum(CurationStatus, { message: 'Status kurasi tidak valid.' })
  curationStatus: CurationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
