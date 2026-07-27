import { PartialType } from '@nestjs/mapped-types';
import { CreateArtworkDto } from './create-artwork.dto';

export class UpdateArtworkDto extends PartialType(CreateArtworkDto) {}
