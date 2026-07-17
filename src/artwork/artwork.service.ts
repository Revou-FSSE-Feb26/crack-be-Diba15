import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateArtworkDto } from './dto/create-artwork.dto.js';
import { CurateArtworkDto } from './dto/curate-artwork.dto.js';
import { UpdateArtworkDto } from './dto/update-artwork.dto.js';

@Injectable()
export class ArtworkService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToFrontendArtwork(artwork: any) {
    return {
      id: artwork.id,
      artists_id: artwork.artistsId,
      title: artwork.title,
      description: artwork.description,
      images_url: artwork.imagesUrl,
      wip_proof_url: artwork.wipProofUrl || undefined,
      upload_type: artwork.uploadType,
      curation_status: artwork.curationStatus,
      is_visible_on_feed: artwork.isVisibleOnFeed,
      rejection_reason: artwork.rejectionReason,
      reviewed_at: artwork.reviewedAt?.toISOString() || null,
      reviewed_by: artwork.reviewedBy || null,
      created_at: artwork.createdAt.toISOString(),
      artist: artwork.artist
        ? {
            id: artwork.artist.id,
            name: artwork.artist.name,
          }
        : undefined,
      artist_profile: artwork.artist?.profile
        ? {
            is_verified: artwork.artist.profile.isVerified,
            is_open_for_commission: artwork.artist.profile.isOpenForCommission,
          }
        : undefined,
      tags: artwork.tags
        ? artwork.tags.map((t: any) => ({
            id: t.tag.id,
            tag_name: t.tag.tagName,
          }))
        : [],
    };
  }

  // ─── Create Artwork ──────────────────────────────────────────────────────────
  async create(artistsId: string, dto: CreateArtworkDto) {
    const { title, description, imagesUrl, wipProofUrl, uploadType, tagNames } = dto;

    // Pastikan user adalah artist dan tidak diblokir
    const profile = await this.prisma.profile.findUnique({
      where: { userId: artistsId },
    });

    if (!profile) {
      throw new BadRequestException('Profil artist tidak ditemukan.');
    }

    if (profile.strikeCount >= 5) {
      throw new ForbiddenException(
        'Akun Anda telah ditangguhkan karena melanggar aturan TruBrush (Strike Count 5/5). Anda tidak dapat mengunggah karya baru.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Buat artwork
      const artwork = await tx.artwork.create({
        data: {
          artistsId,
          title,
          description: description || null,
          imagesUrl,
          wipProofUrl: wipProofUrl || null,
          uploadType,
          curationStatus: 'pending', // Default saat artist buat baru
          isVisibleOnFeed: false, // Menunggu kurasi
        },
      });

      // 2. Hubungkan tag-tag
      if (tagNames && tagNames.length > 0) {
        for (const name of tagNames) {
          const normalized = name.trim().toLowerCase();
          if (!normalized) continue;

          // Upsert tag
          const tag = await tx.tag.upsert({
            where: { tagName: normalized },
            update: {},
            create: { tagName: normalized },
          });

          // Hubungkan tag ke artwork
          await tx.artworkTag.create({
            data: {
              artworkId: artwork.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Ambil data lengkap
      const fullArtwork = await tx.artwork.findUnique({
        where: { id: artwork.id },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  isVerified: true,
                  isOpenForCommission: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return this.mapToFrontendArtwork(fullArtwork);
    });
  }

  // ─── Find All Artworks ──────────────────────────────────────────────────────
  async findAll(filters: {
    search?: string;
    tag?: string;
    artistId?: string;
    curationStatus?: string;
    isVisibleOnFeed?: string;
  }) {
    const where: any = {};

    if (filters.search) {
      const query = filters.search.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          artist: {
            name: { contains: query, mode: 'insensitive' },
          },
        },
      ];
    }

    if (filters.tag) {
      where.tags = {
        some: {
          tag: {
            tagName: {
              equals: filters.tag.trim().toLowerCase(),
            },
          },
        },
      };
    }

    if (filters.artistId) {
      where.artistsId = filters.artistId;
    }

    if (filters.curationStatus) {
      where.curationStatus = filters.curationStatus;
    }

    if (filters.isVisibleOnFeed !== undefined) {
      where.isVisibleOnFeed = filters.isVisibleOnFeed === 'true';
    }

    const artworks = await this.prisma.artwork.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                isVerified: true,
                isOpenForCommission: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return artworks.map((a) => this.mapToFrontendArtwork(a));
  }

  // ─── Find One Artwork ───────────────────────────────────────────────────────
  async findOne(id: string) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                isVerified: true,
                isOpenForCommission: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    return this.mapToFrontendArtwork(artwork);
  }

  // ─── Update Artwork ─────────────────────────────────────────────────────────
  async update(id: string, requesterId: string, requesterRole: string, dto: UpdateArtworkDto) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
    });

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    // Hanya pemilik artwork atau admin yang boleh mengedit
    const isOwner = artwork.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak mengubah artwork ini.');
    }

    const { title, description, imagesUrl, wipProofUrl, uploadType, tagNames, isVisibleOnFeed } =
      dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update data dasar
      await tx.artwork.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          imagesUrl: imagesUrl !== undefined ? imagesUrl : undefined,
          wipProofUrl: wipProofUrl !== undefined ? wipProofUrl : undefined,
          uploadType: uploadType !== undefined ? uploadType : undefined,
          isVisibleOnFeed: isVisibleOnFeed !== undefined ? isVisibleOnFeed : undefined,
        },
      });

      // 2. Update tag-tag jika dikirimkan
      if (tagNames !== undefined) {
        // Hapus relasi tag lama
        await tx.artworkTag.deleteMany({
          where: { artworkId: id },
        });

        // Hubungkan tag baru
        for (const name of tagNames) {
          const normalized = name.trim().toLowerCase();
          if (!normalized) continue;

          // Upsert tag
          const tag = await tx.tag.upsert({
            where: { tagName: normalized },
            update: {},
            create: { tagName: normalized },
          });

          // Hubungkan tag ke artwork
          await tx.artworkTag.create({
            data: {
              artworkId: id,
              tagId: tag.id,
            },
          });
        }
      }

      const updated = await tx.artwork.findUnique({
        where: { id },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  isVerified: true,
                  isOpenForCommission: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return this.mapToFrontendArtwork(updated);
    });
  }

  // ─── Curate/Review Artwork ──────────────────────────────────────────────────
  async curate(id: string, reviewerId: string, dto: CurateArtworkDto) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
    });

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const { curationStatus, rejectionReason } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update status kurasi
      await tx.artwork.update({
        where: { id },
        data: {
          curationStatus,
          rejectionReason: curationStatus === 'rejected' ? rejectionReason || null : null,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          // Tampilkan di feed jika approved
          isVisibleOnFeed: curationStatus === 'approved',
        },
      });

      // 2. Hitung jumlah approved artwork artist untuk verifikasi otomatis
      const artistId = artwork.artistsId;
      const approvedCount = await tx.artwork.count({
        where: {
          artistsId: artistId,
          curationStatus: 'approved',
        },
      });

      // Syarat verifikasi: minimal 5 artwork yang approved
      const isEligible = approvedCount >= 5;

      await tx.profile.update({
        where: { userId: artistId },
        data: {
          approvedPortfolioCount: approvedCount,
          isVerified: isEligible,
        },
      });

      const finalArtwork = await tx.artwork.findUnique({
        where: { id },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  isVerified: true,
                  isOpenForCommission: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return this.mapToFrontendArtwork(finalArtwork);
    });
  }

  // ─── Remove/Delete Artwork ──────────────────────────────────────────────────
  async remove(id: string, requesterId: string, requesterRole: string) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
    });

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    // Hanya pemilik artwork atau admin yang boleh menghapus
    const isOwner = artwork.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak menghapus artwork ini.');
    }

    const artistId = artwork.artistsId;

    return this.prisma.$transaction(async (tx) => {
      // Hapus artwork (relasi cascading ditangani di schema prisma)
      await tx.artwork.delete({
        where: { id },
      });

      // Hitung ulang portfolio yang disetujui
      const approvedCount = await tx.artwork.count({
        where: {
          artistsId: artistId,
          curationStatus: 'approved',
        },
      });

      const isEligible = approvedCount >= 5;

      await tx.profile.update({
        where: { userId: artistId },
        data: {
          approvedPortfolioCount: approvedCount,
          isVerified: isEligible,
        },
      });

      return { message: 'Artwork berhasil dihapus.' };
    });
  }

  // ─── Get Popular Tags ───────────────────────────────────────────────────────
  async getPopularTags() {
    // Cari tag yang paling banyak diasosiasikan dengan artwork
    const tagsCount = await this.prisma.artworkTag.groupBy({
      by: ['tagId'],
      _count: {
        artworkId: true,
      },
      orderBy: {
        _count: {
          artworkId: 'desc',
        },
      },
      take: 10,
    });

    const popularTags: any[] = [];
    for (const item of tagsCount) {
      const tag = await this.prisma.tag.findUnique({
        where: { id: item.tagId },
      });
      if (tag) {
        popularTags.push({
          id: tag.id,
          tag_name: tag.tagName,
          count: item._count.artworkId,
        });
      }
    }

    return popularTags;
  }
}
