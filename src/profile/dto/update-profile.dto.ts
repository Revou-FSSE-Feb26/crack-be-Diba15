import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @IsOptional()
  @IsString()
  pixivUrl?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsBoolean()
  isOpenForCommission?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  basePriceIdr?: number;
}
