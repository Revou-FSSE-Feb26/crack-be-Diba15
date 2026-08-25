import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';

export class CreateCommissionDto {
  @ApiProperty({ example: 'u-001', description: 'ID artis yang dituju' })
  @IsNotEmpty({ message: 'artistsId harus diisi.' })
  @IsString()
  artistsId: string;

  @ApiProperty({ example: 'Ilustrasi Karakter Anime Custom', description: 'Judul pesanan komisi' })
  @IsNotEmpty({ message: 'Judul komisi harus diisi.' })
  @IsString()
  commissionTitle: string;

  @ApiPropertyOptional({
    example: 'Karakter berambut perak dengan pakaian tradisional Jepang, pose berdiri.',
    description: 'Deskripsi lengkap brief pengerjaan komisi',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 450000,
    description: 'Harga kesepakatan komisi dalam IDR',
    minimum: 10000,
  })
  @IsNotEmpty({ message: 'Harga komisi harus diisi.' })
  @IsNumber({}, { message: 'Harga komisi harus berupa angka.' })
  @Min(10000, { message: 'Harga komisi minimal Rp10.000.' })
  price: number;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    example: PaymentMethod.wallet,
    description: 'Metode pembayaran yang digunakan (wallet atau credit_card)',
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Metode pembayaran tidak valid.' })
  paymentMethod?: PaymentMethod;
}
