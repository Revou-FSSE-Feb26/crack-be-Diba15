import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ari@example.com', description: 'Alamat email pengguna terdaftar' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password akun' })
  @IsString()
  password: string;
}
