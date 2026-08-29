import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAppealDto {
  @ApiProperty({
    description: 'Alasan permohonan banding pemulihan akun artist (minimal 30 karakter)',
    example:
      'Saya ingin mengajukan banding karena karya yang dilaporkan adalah hasil gambar manual saya dengan bukti file PSD dan timelapse terlampir.',
    minLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'Alasan banding minimal harus 30 karakter' })
  reason: string;
}
