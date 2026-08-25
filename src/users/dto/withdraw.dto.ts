import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({
    example: 100000,
    description: 'Nominal penarikan dana (IDR), minimal Rp100.000',
    minimum: 100000,
  })
  @IsNotEmpty({ message: 'Nominal penarikan dana tidak boleh kosong.' })
  @IsNumber({}, { message: 'Nominal penarikan dana harus berupa angka.' })
  @Min(100000, { message: 'Minimal penarikan dana adalah Rp 100.000.' })
  amount: number;

  @ApiProperty({ example: 'BCA', description: 'Nama bank atau e-wallet tujuan' })
  @IsNotEmpty({ message: 'Nama bank atau e-wallet tujuan wajib diisi.' })
  @IsString({ message: 'Nama bank atau e-wallet harus berupa teks.' })
  bankName: string;

  @ApiProperty({ example: '1234567890', description: 'Nomor rekening atau nomor e-wallet tujuan' })
  @IsNotEmpty({ message: 'Nomor rekening atau nomor e-wallet tujuan wajib diisi.' })
  @IsString({ message: 'Nomor rekening atau e-wallet harus berupa teks.' })
  accountNumber: string;

  @ApiProperty({ example: 'Ari Ramadan', description: 'Nama pemilik rekening bank tujuan' })
  @IsNotEmpty({ message: 'Nama pemilik rekening wajib diisi.' })
  @IsString({ message: 'Nama pemilik rekening harus berupa teks.' })
  accountName: string;
}
