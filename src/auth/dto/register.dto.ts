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
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(PublicRole, {
    message: 'Role hanya boleh "artist" atau "client".',
  })
  role: PublicRole;
}
