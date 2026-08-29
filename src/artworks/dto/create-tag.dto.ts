import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    description: 'Nama tag kategori karya seni',
    example: 'watercolor',
  })
  @IsString({ message: 'Nama tag harus berupa string.' })
  @IsNotEmpty({ message: 'Nama tag tidak boleh kosong.' })
  @MinLength(2, { message: 'Nama tag minimal 2 karakter.' })
  @MaxLength(30, { message: 'Nama tag maksimal 30 karakter.' })
  tagName: string;
}
