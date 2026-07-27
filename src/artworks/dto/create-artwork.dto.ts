import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { UploadType } from '../../generated/prisma/enums';

export class CreateArtworkDto {
  @IsNotEmpty({ message: 'Judul artwork harus diisi.' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Minimal harus ada 1 URL gambar.' })
  @IsArray({ message: 'imagesUrl harus berupa array.' })
  @IsUrl({}, { each: true, message: 'Format URL gambar tidak valid.' })
  imagesUrl: string[];

  @IsOptional()
  @IsUrl({}, { message: 'Format URL WIP proof tidak valid.' })
  wipProofUrl?: string;

  @IsNotEmpty({ message: 'Tipe upload harus diisi.' })
  @IsEnum(UploadType, { message: 'Tipe upload tidak valid.' })
  uploadType: UploadType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @IsOptional()
  @IsString()
  curationStatus?: string;

  @IsOptional()
  isVisibleOnFeed?: boolean;
}
