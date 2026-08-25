import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class TopUpDto {
  @ApiProperty({ example: 500000, description: 'Nominal saldo yang diisi (IDR)', minimum: 10000 })
  @IsNotEmpty({ message: 'Nominal top-up tidak boleh kosong.' })
  @IsNumber({}, { message: 'Nominal top-up harus berupa angka.' })
  @Min(10000, { message: 'Minimal top-up adalah Rp10.000.' })
  amount: number;
}
