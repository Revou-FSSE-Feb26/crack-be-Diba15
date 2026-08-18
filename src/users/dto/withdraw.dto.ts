import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class WithdrawDto {
  @IsNotEmpty({ message: 'Nominal penarikan dana tidak boleh kosong.' })
  @IsNumber({}, { message: 'Nominal penarikan dana harus berupa angka.' })
  @Min(100000, { message: 'Minimal penarikan dana adalah Rp 100.000.' })
  amount: number;

  @IsNotEmpty({ message: 'Nama bank atau e-wallet tujuan wajib diisi.' })
  @IsString({ message: 'Nama bank atau e-wallet harus berupa teks.' })
  bankName: string;

  @IsNotEmpty({ message: 'Nomor rekening atau nomor e-wallet tujuan wajib diisi.' })
  @IsString({ message: 'Nomor rekening atau e-wallet harus berupa teks.' })
  accountNumber: string;

  @IsNotEmpty({ message: 'Nama pemilik rekening wajib diisi.' })
  @IsString({ message: 'Nama pemilik rekening harus berupa teks.' })
  accountName: string;
}
