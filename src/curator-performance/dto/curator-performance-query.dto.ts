import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CuratorPerformanceQueryDto {
  @ApiPropertyOptional({
    description: 'Pencarian nama atau email kurator',
    example: 'dimas',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Tanggal awal filter (ISO 8601 string)',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format startDate harus berupa ISO date string yang valid.' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Tanggal akhir filter (ISO 8601 string)',
    example: '2026-08-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format endDate harus berupa ISO date string yang valid.' })
  endDate?: string;
}
