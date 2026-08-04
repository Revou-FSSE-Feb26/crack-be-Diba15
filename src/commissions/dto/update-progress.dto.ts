import { IsOptional, IsUrl } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsUrl({}, { message: 'Format URL sketsa tidak valid.' })
  sketch_url?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Format URL final artwork tidak valid.' })
  final_artwork_url?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Format URL berkas akhir tidak valid.' })
  final_file_url?: string;
}
