import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UploadType } from '../../generated/prisma/enums.js';

export class CreateArtworkDto {
  @IsString()
  @MinLength(1, { message: 'Judul artwork tidak boleh kosong.' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray({ message: 'imagesUrl harus berupa array dari string.' })
  @IsString({ each: true, message: 'Setiap image URL harus berupa string.' })
  imagesUrl: string[];

  @IsOptional()
  @IsString()
  wipProofUrl?: string;

  @IsEnum(UploadType, { message: 'Tipe upload tidak valid.' })
  uploadType: UploadType;

  @IsOptional()
  @IsArray({ message: 'tagNames harus berupa array dari string.' })
  @IsString({ each: true, message: 'Setiap nama tag harus berupa string.' })
  tagNames?: string[];
}
