import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRevisionDto {
  @IsNotEmpty({ message: 'Komentar revisi harus diisi.' })
  @IsString()
  comment: string;
}
