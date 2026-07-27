import { IsOptional, IsUrl } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsUrl({}, { message: 'Format URL sketsa tidak valid.' })
  sketchUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Format URL final artwork tidak valid.' })
  finalArtworkUrl?: string;
}
