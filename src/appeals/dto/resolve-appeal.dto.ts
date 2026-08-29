import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveAppealDto {
  @ApiProperty({
    description:
      'Keputusan banding: true untuk menyetujui (Approved & Reset Strike), false untuk menolak (Rejected)',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Catatan resolusi atau alasan keputusan admin',
    example: 'Bukti proses berkas PSD valid, pemblokiran akun dicabut dan strike count di-reset.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Catatan resolusi maksimal 500 karakter' })
  resolutionNotes?: string;
}
