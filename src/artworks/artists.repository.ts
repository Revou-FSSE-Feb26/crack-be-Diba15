import { Injectable } from '@nestjs/common';
import type { ArtistsRepositoryInterface } from '../common/interfaces/artists.repository.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistsRepository implements ArtistsRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async findAllArtists() {
    return this.prisma.user.findMany({
      where: { role: 'artist' },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
            instagramUrl: true,
            twitterUrl: true,
            pixivUrl: true,
            websiteUrl: true,
            isVerified: true,
            isOpenForCommission: true,
            basePriceIdr: true,
            approvedPortfolioCount: true,
          },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });
  }

  async findArtistById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: 'artist' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
            instagramUrl: true,
            twitterUrl: true,
            pixivUrl: true,
            websiteUrl: true,
            isVerified: true,
            isOpenForCommission: true,
            basePriceIdr: true,
            approvedPortfolioCount: true,
          },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });
  }
}
