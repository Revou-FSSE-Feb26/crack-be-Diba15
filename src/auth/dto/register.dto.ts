import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../generated/prisma';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;
}
