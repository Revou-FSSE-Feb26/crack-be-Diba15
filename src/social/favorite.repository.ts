import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFavorite(userId: string, artworkId: string) {
    return this.prisma.favorite.findUnique({
      where: {
        userId_artworkId: {
          userId,
          artworkId,
        },
      },
    });
  }

  async createFavorite(userId: string, artworkId: string) {
    return this.prisma.favorite.create({
      data: {
        userId,
        artworkId,
      },
    });
  }

  async deleteFavorite(userId: string, artworkId: string) {
    return this.prisma.favorite.delete({
      where: {
        userId_artworkId: {
          userId,
          artworkId,
        },
      },
    });
  }

  async getUserFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        artwork: {
          include: {
            artist: {
              include: {
                profile: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            favorites: true,
          },
        },
      },
    });

    return favorites.map((f) => f.artwork);
  }

  async getUserFavoriteArtworkIds(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { artworkId: true },
    });

    return favorites.map((f) => f.artworkId);
  }
}
