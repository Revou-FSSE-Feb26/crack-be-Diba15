import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { UploadType } from '../../generated/prisma/enums';

export class CreateArtworkDto {
  @ApiProperty({ example: 'Neon Samurai 2077', description: 'Judul karya seni' })
  @IsNotEmpty({ message: 'Judul artwork harus diisi.' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Ilustrasi bertema cyberpunk dengan teknik pewarnaan digital.',
    description: 'Deskripsi karya seni',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['https://example.com/storage/artworks/image1.jpg'],
    description: 'Array URL gambar karya seni yang telah diunggah',
    type: [String],
  })
  @IsNotEmpty({ message: 'Minimal harus ada 1 URL gambar.' })
  @IsArray({ message: 'imagesUrl harus berupa array.' })
  @IsUrl({}, { each: true, message: 'Format URL gambar tidak valid.' })
  imagesUrl: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/storage/wips/proof1.jpg',
    description: 'URL bukti proses pengerjaan / sketsa asli (WIP proof)',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Format URL WIP proof tidak valid.' })
  wipProofUrl?: string;

  @ApiProperty({
    enum: UploadType,
    example: UploadType.original,
    description: 'Tipe upload karya (original, fanart, atau commission)',
  })
  @IsNotEmpty({ message: 'Tipe upload harus diisi.' })
  @IsEnum(UploadType, { message: 'Tipe upload tidak valid.' })
  uploadType: UploadType;

  @ApiPropertyOptional({
    example: ['cyberpunk', 'digitalart', 'scifi'],
    description: 'Daftar nama tag untuk karya seni',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @ApiPropertyOptional({ example: 'pending', description: 'Status kurasi awal' })
  @IsOptional()
  @IsString()
  curationStatus?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Apakah karya langsung tampil di feed publik',
  })
  @IsOptional()
  isVisibleOnFeed?: boolean;
}
