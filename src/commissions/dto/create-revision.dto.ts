import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRevisionDto {
  @ApiProperty({
    example: 'Tolong bagian rambut warnanya dibuat sedikit lebih terang dan kontras.',
    description: 'Catatan permintaan revisi dari klien',
  })
  @IsNotEmpty({ message: 'Komentar revisi harus diisi.' })
  @IsString()
  comment: string;
}
