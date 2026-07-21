import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArtworkService } from '../artwork/artwork.service.js';
import { UserRepository } from '../user/user.repository.js';
import { FavoriteRepository } from './favorite.repository.js';
import { FollowRepository } from './follow.repository.js';

@Injectable()
export class SocialService {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly followRepository: FollowRepository,
    private readonly artworkRepository: ArtworkService,
    private readonly userRepository: UserRepository,
  ) {}

  // ─── Favorite ─────────────────────────────────────────────────────────────

  async toggleFavorite(userId: string, artworkId: string) {
    const artwork = await this.artworkRepository.findOne(artworkId);
    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const existing = await this.favoriteRepository.findFavorite(userId, artworkId);

    if (existing) {
      await this.favoriteRepository.deleteFavorite(userId, artworkId);
      return { isFavorited: false, message: 'Dihapus dari favorit.' };
    }

    await this.favoriteRepository.createFavorite(userId, artworkId);
    return { isFavorited: true, message: 'Ditambahkan ke favorit.' };
  }

  async getFavorites(userId: string) {
    const favorites = await this.favoriteRepository.getUserFavorites(userId);
    return favorites.map((artwork) => this.artworkRepository.mapToFrontendArtwork(artwork));
  }

  async getFavoriteIds(userId: string) {
    return this.favoriteRepository.getUserFavoriteArtworkIds(userId);
  }

  // ─── Follow ───────────────────────────────────────────────────────────────

  async toggleFollow(followerId: string, artistId: string) {
    if (followerId === artistId) {
      throw new BadRequestException('Tidak dapat mengikuti akun Anda sendiri.');
    }

    const artist = await this.userRepository.findById(artistId);
    if (!artist) {
      throw new NotFoundException('Artis tidak ditemukan.');
    }

    const existing = await this.followRepository.findFollow(followerId, artistId);

    if (existing) {
      await this.followRepository.deleteFollow(followerId, artistId);
      return { isFollowing: false, message: 'Berhenti mengikuti.' };
    }

    await this.followRepository.createFollow(followerId, artistId);
    return { isFollowing: true, message: 'Berhasil mengikuti artis.' };
  }

  async getFollowing(followerId: string) {
    return this.followRepository.getUserFollowing(followerId);
  }

  async getFollowingIds(followerId: string) {
    return this.followRepository.getUserFollowingArtistIds(followerId);
  }
}
