import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

/**
 * Role yang diizinkan saat registrasi publik.
 * Admin dan Curator hanya bisa dibuat oleh admin melalui endpoint khusus.
 */
export enum PublicRole {
  artist = 'artist',
  client = 'client',
}

export class RegisterDto {
  @ApiProperty({ example: 'Ari Ramadan', description: 'Nama lengkap pengguna' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ari@example.com', description: 'Email unik pengguna' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password minimal 8 karakter', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: PublicRole,
    example: PublicRole.artist,
    description: 'Role pengguna (artist atau client)',
  })
  @IsEnum(PublicRole, {
    message: 'Role hanya boleh "artist" atau "client".',
  })
  role: PublicRole;
}
