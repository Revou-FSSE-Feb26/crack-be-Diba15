import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async uploadFile(file: any, folder: string, customFilename?: string): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseBucket = process.env.SUPABASE_BUCKET;

    if (!supabaseUrl || !supabaseKey || !supabaseBucket) {
      throw new BadRequestException('Konfigurasi Supabase Storage belum lengkap di server.');
    }

    // Buat nama file unik atau gunakan customFilename jika disuplai
    const fileExt = file.originalname.split('.').pop() || '';
    const filename = customFilename
      ? `${customFilename}.${fileExt}`
      : `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;

    const filePath = `${folder}/${filename}`;

    // Upload via REST API Supabase Storage
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${supabaseBucket}/${filePath}`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': file.mimetype,
        },
        body: file.buffer,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Supabase Storage upload failed: ${response.statusText} (${errText})`);
      }

      // Mengembalikan URL publik berkas
      // Format: https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[filePath]
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
