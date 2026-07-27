import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportTargetType } from '../../generated/prisma/enums';

export class CreateReportDto {
  @IsNotEmpty({ message: 'artworkId tidak boleh kosong.' })
  @IsString()
  artworkId: string;

  @IsOptional()
  @IsEnum(ReportTargetType, { message: 'Tipe target laporan tidak valid.' })
  targetType?: ReportTargetType;

  @IsNotEmpty({ message: 'Alasan laporan harus diisi.' })
  @IsString()
  reason: string;
}
