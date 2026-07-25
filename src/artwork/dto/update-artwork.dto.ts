import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateArtworkDto } from './create-artwork.dto';

export class UpdateArtworkDto extends PartialType(CreateArtworkDto) {
  @IsOptional()
  @IsBoolean()
  isVisibleOnFeed?: boolean;
}
