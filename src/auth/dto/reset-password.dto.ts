import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5...',
    description: 'Token reset password yang diterima via email',
  })
  @IsString({ message: 'Token harus berupa string.' })
  @IsNotEmpty({ message: 'Token reset password tidak boleh kosong.' })
  token: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Password baru minimal 6 karakter',
    minLength: 6,
  })
  @IsString({ message: 'Password harus berupa string.' })
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong.' })
  newPassword: string;
}
