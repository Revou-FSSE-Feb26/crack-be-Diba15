import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportTargetType } from '../../generated/prisma/enums';

export class CreateReportDto {
  @ApiProperty({ example: 'a-001', description: 'ID karya seni yang dilaporkan' })
  @IsNotEmpty({ message: 'artworkId tidak boleh kosong.' })
  @IsString()
  artworkId: string;

  @ApiPropertyOptional({
    enum: ReportTargetType,
    example: ReportTargetType.artwork,
    description: 'Tipe target laporan (artwork, artist, comment)',
  })
  @IsOptional()
  @IsEnum(ReportTargetType, { message: 'Tipe target laporan tidak valid.' })
  targetType?: ReportTargetType;

  @ApiProperty({
    example: 'Karya terdeteksi menggunakan generative AI dan meniru gaya artis lain tanpa izin.',
    description: 'Alasan rinci pelaporan',
  })
  @IsNotEmpty({ message: 'Alasan laporan harus diisi.' })
  @IsString()
  reason: string;
}
