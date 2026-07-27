import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsNotEmpty({ message: 'commissionId tidak boleh kosong.' })
  @IsString()
  commissionId: string;

  @IsNotEmpty({ message: 'Alasan sengketa harus diisi.' })
  @IsString()
  reason: string;
}
