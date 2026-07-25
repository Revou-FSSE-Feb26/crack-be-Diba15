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
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAccessGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ─── Single File Upload (POST /api/upload) — KHUSUS AVATAR ──────────────────
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUser('sub') userId: string,
  ) {
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

    return this.uploadService.handleAvatarUpload(userId, file);
  }

  // ─── Multiple Files Upload (POST /api/upload/bulk) — ARTWORKS & WIPS ────────
  @Post('bulk')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder = 'artworks',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal satu file wajib diunggah.');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maksimal pengunggahan adalah 5 file dalam sekali kirim.');
    }

    const allowedFolders = ['artworks', 'wips'];
    if (!allowedFolders.includes(folder)) {
      throw new BadRequestException(
        'Folder tujuan tidak diizinkan. Hanya folder "artworks" dan "wips" yang diperbolehkan untuk bulk upload.',
      );
    }

    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/quicktime', 'video/webm'];

    for (const file of files) {
      const isImage = allowedImages.includes(file.mimetype);
      const isVideo = allowedVideos.includes(file.mimetype);

      if (!isImage && !isVideo) {
        throw new BadRequestException(
          `File "${file.originalname}" memiliki format tidak valid. Hanya gambar (termasuk GIF) dan video (mp4, mov, webm) yang diperbolehkan.`,
        );
      }

      if (isImage) {
        const maxImageSize = 10 * 1024 * 1024;
        if (file.size > maxImageSize) {
          throw new BadRequestException(
            `Ukuran gambar "${file.originalname}" melebihi batas maksimal 10MB.`,
          );
        }
      } else if (isVideo) {
        const maxVideoSize = 30 * 1024 * 1024;
        if (file.size > maxVideoSize) {
          throw new BadRequestException(
            `Ukuran video "${file.originalname}" melebihi batas maksimal 30MB.`,
          );
        }
      }
    }

    const urls: string[] = [];
    for (const file of files) {
      const url = await this.uploadService.uploadFile(file, folder);
      urls.push(url);
    }

    return { urls };
  }
}
