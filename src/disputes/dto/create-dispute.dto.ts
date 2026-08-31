import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ example: 'c-001', description: 'ID komisi yang disengketakan' })
  @IsNotEmpty({ message: 'commissionId tidak boleh kosong.' })
  @IsString()
  commissionId: string;

  @ApiProperty({
    example: 'Artis tidak menyelesaikan pesanan sesuai kesepakatan dan batas waktu.',
    description: 'Alasan pengajuan sengketa / mediasi',
  })
  @IsNotEmpty({ message: 'Alasan sengketa harus diisi.' })
  @IsString()
  reason: string;
}
