import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesRepository } from '../profiles/profiles.repository';

@Injectable()
export class UploadService {
  constructor(
    private readonly profileRepository: ProfilesRepository,
    private readonly prisma: PrismaService,
  ) {}

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

  // ─── Commission Storage Cleanup & Uploads ────────────────────────────────

  async handleCommissionSketchUpload(
    commissionId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    // 1. Periksa apakah sudah ada sketchUrl sebelumnya di CommissionProgress
    const progress = await this.prisma.commissionProgress.findUnique({
      where: { commissionId },
    });

    // 2. Jika ada berkas sketsa lama, hapus otomatis dari Supabase Storage sebelum simpan yang baru
    if (progress?.sketchUrl) {
      const bucketName = process.env.SUPABASE_BUCKET || 'trubrush';
      const parts = progress.sketchUrl.split(`/public/${bucketName}/`);
      if (parts.length > 1) {
        const oldFilePath = parts[1];
        await this.deleteFile(oldFilePath);
      }
    }

    // 3. Simpan berkas sketsa baru ke commissions/:commissionId/sketch
    const folderPath = `commissions/${commissionId}/sketch`;
    const url = await this.uploadFile(file, folderPath);
    return { url };
  }

  async handleCommissionPreviewUpload(
    commissionId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    // 1. Periksa apakah sudah ada finalArtworkUrl sebelumnya di CommissionProgress
    const progress = await this.prisma.commissionProgress.findUnique({
      where: { commissionId },
    });

    // 2. Jika ada berkas preview final lama, hapus otomatis dari Supabase Storage sebelum simpan yang baru
    if (progress?.finalArtworkUrl) {
      const bucketName = process.env.SUPABASE_BUCKET || 'trubrush';
      const parts = progress.finalArtworkUrl.split(`/public/${bucketName}/`);
      if (parts.length > 1) {
        const oldFilePath = parts[1];
        await this.deleteFile(oldFilePath);
      }
    }

    // 3. Simpan berkas preview final baru ke commissions/:commissionId/preview
    const folderPath = `commissions/${commissionId}/preview`;
    const url = await this.uploadFile(file, folderPath);
    return { url };
  }

  async handleCommissionFinalUpload(
    commissionId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    // 1. Periksa apakah sudah ada finalFileUrl sebelumnya di CommissionProgress
    const progress = await this.prisma.commissionProgress.findUnique({
      where: { commissionId },
    });

    // 2. Jika ada berkas arsip final lama, hapus otomatis dari Supabase Storage sebelum simpan yang baru
    if ((progress as any)?.finalFileUrl) {
      const bucketName = process.env.SUPABASE_BUCKET || 'trubrush';
      const parts = (progress as any).finalFileUrl.split(`/public/${bucketName}/`);
      if (parts.length > 1) {
        const oldFilePath = parts[1];
        await this.deleteFile(oldFilePath);
      }
    }

    // 3. Simpan berkas hasil akhir ke commissions/:commissionId/final
    const folderPath = `commissions/${commissionId}/final`;
    const url = await this.uploadFile(file, folderPath);
    return { url };
  }

  async handleCommissionWipUpload(
    commissionId: string,
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    const folderPath = `commissions/${commissionId}/wip`;
    const urls: string[] = [];

    for (const file of files) {
      const url = await this.uploadFile(file, folderPath);
      urls.push(url);
    }

    return { urls };
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
