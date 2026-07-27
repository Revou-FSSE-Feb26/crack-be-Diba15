import { IsBoolean, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @IsOptional()
  @IsUrl()
  pixivUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsBoolean()
  isOpenForCommission?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePriceIdr?: number;
}
