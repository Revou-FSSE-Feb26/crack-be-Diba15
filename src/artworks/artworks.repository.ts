import { Injectable } from '@nestjs/common';
import type { ArtworksRepositoryInterface } from '../common/interfaces/artworks.repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateArtworkDto } from './dto/create-artwork.dto';
import type { CurateArtworkDto } from './dto/curate-artwork.dto';
import type { UpdateArtworkDto } from './dto/update-artwork.dto';

// Selector yang digunakan untuk include data yang dibutuhkan dalam artwork
const artworkWithRelationsSelect = {
  include: {
    artist: {
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            isVerified: true,
            isOpenForCommission: true,
            avatarUrl: true,
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
};

/**
 * Class Repository untuk handle logic data artworks
 * Meng-implementasi dari interface ArtworksRepositoryInterface
 */
@Injectable()
export class ArtworksRepository implements ArtworksRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

  async findArtworkByIdRaw(id: string) {
    return this.prisma.artwork.findUnique({
      where: { id },
    });
  }

  async findArtworkById(id: string) {
    return this.prisma.artwork.findUnique({
      where: { id },
      ...artworkWithRelationsSelect,
    });
  }

  async create(artistsId: string, dto: CreateArtworkDto) {
    const {
      title,
      description,
      imagesUrl,
      wipProofUrl,
      uploadType,
      tagNames,
      curationStatus,
      isVisibleOnFeed,
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      const artwork = await tx.artwork.create({
        data: {
          artistsId,
          title,
          description: description || null,
          imagesUrl,
          wipProofUrl: wipProofUrl || null,
          uploadType,
          curationStatus: (curationStatus as any) || 'pending',
          isVisibleOnFeed: isVisibleOnFeed !== undefined ? isVisibleOnFeed : false,
        },
      });

      if (tagNames && tagNames.length > 0) {
        for (const name of tagNames) {
          const normalized = name.trim().toLowerCase();
          if (!normalized) continue;

          const tag = await tx.tag.upsert({
            where: { tagName: normalized },
            update: {},
            create: { tagName: normalized },
          });

          await tx.artworkTag.create({
            data: {
              artworkId: artwork.id,
              tagId: tag.id,
            },
          });
        }
      }

      return tx.artwork.findUnique({
        where: { id: artwork.id },
        ...artworkWithRelationsSelect,
      });
    });
  }

  private buildWhereClause(filters: {
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

    return where;
  }

  async count(filters: {
    search?: string;
    tag?: string;
    artistId?: string;
    curationStatus?: string;
    isVisibleOnFeed?: string;
  }) {
    const where = this.buildWhereClause(filters);
    return this.prisma.artwork.count({ where });
  }

  async findAll(filters: {
    search?: string;
    tag?: string;
    artistId?: string;
    curationStatus?: string;
    isVisibleOnFeed?: string;
    page?: number;
    limit?: number;
  }) {
    const where = this.buildWhereClause(filters);
    const queryOptions: any = {
      where,
      orderBy: {
        createdAt: 'desc',
      },
      ...artworkWithRelationsSelect,
    };

    if (filters.page && filters.limit) {
      queryOptions.skip = (filters.page - 1) * filters.limit;
      queryOptions.take = filters.limit;
    }

    return this.prisma.artwork.findMany(queryOptions);
  }

  async update(id: string, dto: UpdateArtworkDto) {
    const { title, description, imagesUrl, wipProofUrl, uploadType, tagNames, isVisibleOnFeed } =
      dto;

    return this.prisma.$transaction(async (tx) => {
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

      if (tagNames !== undefined) {
        await tx.artworkTag.deleteMany({
          where: { artworkId: id },
        });

        for (const name of tagNames) {
          const normalized = name.trim().toLowerCase();
          if (!normalized) continue;

          const tag = await tx.tag.upsert({
            where: { tagName: normalized },
            update: {},
            create: { tagName: normalized },
          });

          await tx.artworkTag.create({
            data: {
              artworkId: id,
              tagId: tag.id,
            },
          });
        }
      }

      return tx.artwork.findUnique({
        where: { id },
        ...artworkWithRelationsSelect,
      });
    });
  }

  async curate(id: string, reviewerId: string, dto: CurateArtworkDto) {
    const artwork = await this.prisma.artwork.findUnique({
      where: { id },
    });
    if (!artwork) return null;

    const { curationStatus, rejectionReason } = dto;
    const artistId = artwork.artistsId;

    return this.prisma.$transaction(async (tx) => {
      await tx.artwork.update({
        where: { id },
        data: {
          curationStatus,
          rejectionReason: curationStatus === 'rejected' ? rejectionReason || null : null,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          isVisibleOnFeed: curationStatus === 'approved',
        },
      });

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

      return tx.artwork.findUnique({
        where: { id },
        ...artworkWithRelationsSelect,
      });
    });
  }

  async delete(id: string, artistId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.artwork.delete({
        where: { id },
      });

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
    });
  }
}
