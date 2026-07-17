import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UploadService } from './upload.service.js';

@Controller('upload')
@UseGuards(JwtAccessGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Single File Upload (POST /api/upload) — KHUSUS AVATAR ──────────────────
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any, @GetCurrentUser('sub') userId: string) {
    if (!file) {
      throw new BadRequestException('File avatar wajib diunggah.');
    }

    // Validasi ukuran (maksimal 5MB untuk avatar)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Ukuran file avatar maksimal 5MB.');
    }

    // Validasi tipe mime (hanya gambar statis untuk avatar)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipe file avatar tidak valid. Hanya png, jpg, jpeg, dan webp yang diperbolehkan.',
      );
    }

    // 1. Dapatkan profil saat ini untuk memeriksa jika sudah ada avatar sebelumnya
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    // 2. Jika ada avatar lama, hapus berkasnya dari Supabase Storage terlebih dahulu
    if (profile?.avatarUrl) {
      const bucketName = process.env.SUPABASE_BUCKET || 'trubrush';
      const parts = profile.avatarUrl.split(`/public/${bucketName}/`);
      if (parts.length > 1) {
        const oldFilePath = parts[1];
        await this.uploadService.deleteFile(oldFilePath);
      }
    }

    // 3. Simpan avatar baru dengan nama spesifik: avatars/avatar-[userId].[ext]
    const customFilename = `avatar-${userId}`;
    const url = await this.uploadService.uploadFile(file, 'avatars', customFilename);

    // 4. Update avatarUrl di database Profile user
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl: url },
    });

    return { url };
  }

  // ─── Multiple Files Upload (POST /api/upload/bulk) — ARTWORKS & WIPS ────────
  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files', 5)) // Batasi maksimal 5 file di tingkat interceptor
  async uploadMultiple(@UploadedFiles() files: any[], @Query('folder') folder = 'artworks') {
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal satu file wajib diunggah.');
    }

    // Batasi upload maksimal 5 file
    if (files.length > 5) {
      throw new BadRequestException('Maksimal pengunggahan adalah 5 file dalam sekali kirim.');
    }

    // Validasi folder tujuan
    const allowedFolders = ['artworks', 'wips'];
    if (!allowedFolders.includes(folder)) {
      throw new BadRequestException(
        'Folder tujuan tidak diizinkan. Hanya folder "artworks" dan "wips" yang diperbolehkan untuk bulk upload.',
      );
    }

    // Mime types yang diperbolehkan
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/quicktime', 'video/webm'];

    // Validasi semua file terlebih dahulu
    for (const file of files) {
      const isImage = allowedImages.includes(file.mimetype);
      const isVideo = allowedVideos.includes(file.mimetype);

      if (!isImage && !isVideo) {
        throw new BadRequestException(
          `File "${file.originalname}" memiliki format tidak valid. Hanya gambar (termasuk GIF) dan video (mp4, mov, webm) yang diperbolehkan.`,
        );
      }

      // Validasi ukuran berkas
      if (isImage) {
        const maxImageSize = 10 * 1024 * 1024; // 10MB untuk gambar/gif
        if (file.size > maxImageSize) {
          throw new BadRequestException(
            `Ukuran gambar "${file.originalname}" melebihi batas maksimal 10MB.`,
          );
        }
      } else if (isVideo) {
        const maxVideoSize = 30 * 1024 * 1024; // 30MB untuk video
        if (file.size > maxVideoSize) {
          throw new BadRequestException(
            `Ukuran video "${file.originalname}" melebihi batas maksimal 30MB.`,
          );
        }
      }
    }

    // Upload file satu per satu ke Supabase
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.uploadService.uploadFile(file, folder);
      urls.push(url);
    }

    return { urls };
  }
}
