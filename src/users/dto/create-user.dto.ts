import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Nama harus diisi.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email harus diisi.' })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email: string;

  @IsNotEmpty({ message: 'Password harus diisi.' })
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter.' })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role tidak valid.' })
  role?: Role;
}
