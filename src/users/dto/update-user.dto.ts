import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Dimas Prasetyo Updated', description: 'Nama lengkap user baru' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'newPassword123',
    description: 'Password baru minimal 8 karakter',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'client', description: 'Role pengguna' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 1000000, description: 'Saldo pengguna' })
  @IsOptional()
  balance?: number;
}
