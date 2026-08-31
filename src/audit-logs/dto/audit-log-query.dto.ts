import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'Kategori log audit moderasi',
    enum: ['all', 'curation', 'report', 'dispute', 'appeal'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'curation', 'report', 'dispute', 'appeal'])
  category?: 'all' | 'curation' | 'report' | 'dispute' | 'appeal' = 'all';

  @ApiPropertyOptional({
    description: 'Pencarian teks berdasarkan nama staf, judul karya, atau alasan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal mulai (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal akhir (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Halaman data (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Jumlah item per halaman', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
