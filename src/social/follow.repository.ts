import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFollow(followerId: string, artistId: string) {
    return this.prisma.follow.findUnique({
      where: {
        followerId_artistId: {
          followerId,
          artistId,
        },
      },
    });
  }

  async createFollow(followerId: string, artistId: string) {
    return this.prisma.follow.create({
      data: {
        followerId,
        artistId,
      },
    });
  }

  async deleteFollow(followerId: string, artistId: string) {
    return this.prisma.follow.delete({
      where: {
        followerId_artistId: {
          followerId,
          artistId,
        },
      },
    });
  }

  async getUserFollowing(followerId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId },
      orderBy: { createdAt: 'desc' },
      include: {
        artist: {
          include: {
            profile: true,
          },
        },
      },
    });

    return follows.map((f) => f.artist);
  }

  async getUserFollowingArtistIds(followerId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { artistId: true },
    });

    return follows.map((f) => f.artistId);
  }
}
