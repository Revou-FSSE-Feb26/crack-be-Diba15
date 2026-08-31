import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class UpdateProgressDto {
  @ApiPropertyOptional({
    example: 'https://example.com/storage/commissions/c-001/sketch/sketch1.jpg',
    description: 'URL gambar berkas sketsa awal',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Format URL sketsa tidak valid.' })
  sketch_url?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/storage/commissions/c-001/preview/final_preview.jpg',
    description: 'URL preview gambar final dengan watermark',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Format URL final artwork tidak valid.' })
  final_artwork_url?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/storage/commissions/c-001/final/master_file.zip',
    description: 'URL berkas arsip resolusi penuh / PSD tanpa watermark',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Format URL berkas akhir tidak valid.' })
  final_file_url?: string;
}
