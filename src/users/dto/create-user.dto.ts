import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Dimas Prasetyo', description: 'Nama lengkap user' })
  @IsNotEmpty({ message: 'Nama harus diisi.' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'dimas@example.com', description: 'Alamat email user' })
  @IsNotEmpty({ message: 'Email harus diisi.' })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password minimal 8 karakter', minLength: 8 })
  @IsNotEmpty({ message: 'Password harus diisi.' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter.' })
  password: string;

  @ApiPropertyOptional({ enum: Role, example: Role.client, description: 'Role pengguna' })
  @IsOptional()
  @IsEnum(Role, { message: 'Role tidak valid.' })
  role?: Role;
}
