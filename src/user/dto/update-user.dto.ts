import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

/**
 * DTO untuk update data user oleh user itu sendiri.
 * Field role dan balance tidak disertakan di sini — hanya admin yang bisa mengubahnya
 * dan itu ditangani langsung di controller sebelum diteruskan ke service.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  // Dua field berikut hanya bisa diisi oleh admin.
  // Controller akan menghapus field ini jika requester bukan admin.
  role?: string;
  balance?: number;
}
