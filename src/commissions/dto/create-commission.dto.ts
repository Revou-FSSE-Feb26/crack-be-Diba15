import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';

export class CreateCommissionDto {
  @IsNotEmpty({ message: 'artistsId harus diisi.' })
  @IsString()
  artistsId: string;

  @IsNotEmpty({ message: 'Judul komisi harus diisi.' })
  @IsString()
  commissionTitle: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Harga komisi harus diisi.' })
  @IsNumber({}, { message: 'Harga komisi harus berupa angka.' })
  @Min(10000, { message: 'Harga komisi minimal Rp10.000.' })
  price: number;

  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Metode pembayaran tidak valid.' })
  paymentMethod?: PaymentMethod;
}
