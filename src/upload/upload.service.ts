import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileRepository } from '../profile/profile.repository.js';

@Injectable()
export class UploadService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async handleAvatarUpload(userId: string, file: Express.Multer.File): Promise<{ url: string }> {
    // 1. Dapatkan profil saat ini untuk memeriksa jika sudah ada avatar sebelumnya
    const profile = await this.profileRepository.findByUserId(userId);

    // 2. Jika ada avatar lama, hapus berkasnya dari Supabase Storage terlebih dahulu
    if (profile?.avatarUrl) {
      const bucketName = process.env.SUPABASE_BUCKET || 'trubrush';
      const parts = profile.avatarUrl.split(`/public/${bucketName}/`);
      if (parts.length > 1) {
        const oldFilePath = parts[1];
        await this.deleteFile(oldFilePath);
      }
    }

    // 3. Simpan avatar baru dengan nama spesifik: avatars/avatar-[userId].[ext]
    const customFilename = `avatar-${userId}`;
    const url = await this.uploadFile(file, 'avatars', customFilename);

    // 4. Update avatarUrl di database Profile user via ProfileRepository
    await this.profileRepository.updateAvatarUrl(userId, url);

    return { url };
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    customFilename?: string,
  ): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseBucket = process.env.SUPABASE_BUCKET;

    if (!supabaseUrl || !supabaseKey || !supabaseBucket) {
      throw new BadRequestException('Konfigurasi Supabase Storage belum lengkap di server.');
    }

    const fileExt = file.originalname.split('.').pop() || '';
    const filename = customFilename
      ? `${customFilename}.${fileExt}`
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;

    const filePath = `${folder}/${filename}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${supabaseBucket}/${filePath}`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': file.mimetype,
        },
        body: new Uint8Array(file.buffer),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase Storage upload failed: ${response.statusText} (${errText})`);
      }

      return `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/${filePath}`;
    } catch (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw new BadRequestException(`Gagal mengunggah berkas: ${(error as Error).message}`);
    }
  }

  // ─── Delete File dari Supabase Storage ──────────────────────────────────────
  async deleteFile(filePath: string): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseBucket = process.env.SUPABASE_BUCKET;

    if (!supabaseUrl || !supabaseKey || !supabaseBucket) {
      return;
    }

    const deleteUrl = `${supabaseUrl}/storage/v1/object/${supabaseBucket}/${filePath}`;

    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`Supabase Storage file deletion returned status: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Gagal menghapus file lama dari Supabase:', error);
    }
  }
}
