import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isOpenForCommission?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  basePriceIdr?: number;
}
