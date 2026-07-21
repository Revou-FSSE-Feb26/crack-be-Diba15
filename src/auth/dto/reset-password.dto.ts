import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token harus berupa string.' })
  @IsNotEmpty({ message: 'Token reset password tidak boleh kosong.' })
  token: string;

  @IsString({ message: 'Password harus berupa string.' })
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong.' })
  newPassword: string;
}
