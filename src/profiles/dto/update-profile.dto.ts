import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'https://example.com/avatars/u-001.jpg',
    description: 'URL foto avatar profil',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'Digital Concept Artist & Illustrator berpusat di Bandung.',
    description: 'Bio profil',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/ari_art',
    description: 'Tautan Instagram',
  })
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiPropertyOptional({ example: 'https://x.com/ari_art', description: 'Tautan Twitter / X' })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @ApiPropertyOptional({ example: 'https://pixiv.me/ari_art', description: 'Tautan Pixiv' })
  @IsOptional()
  @IsUrl()
  pixivUrl?: string;

  @ApiPropertyOptional({ example: 'https://ariart.my.id', description: 'Tautan Website Pribadi' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: true, description: 'Status membuka komisi (Open / Closed)' })
  @IsOptional()
  @IsBoolean()
  isOpenForCommission?: boolean;

  @ApiPropertyOptional({
    example: 450000,
    description: 'Harga dasar estimasi komisi (IDR)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePriceIdr?: number;
}
