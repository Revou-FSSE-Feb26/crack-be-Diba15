import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArtworksRepository } from './artworks.repository';
import type { CreateArtworkDto } from './dto/create-artwork.dto';
import type { CurateArtworkDto } from './dto/curate-artwork.dto';
import type { UpdateArtworkDto } from './dto/update-artwork.dto';

@Injectable()
export class ArtworksService {
  constructor(private readonly artworksRepository: ArtworksRepository) {}

  mapToFrontendArtwork(artwork: any) {
    if (!artwork) return null;
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
            avatar_url: artwork.artist.profile.avatarUrl || null,
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

  async create(artistsId: string, dto: CreateArtworkDto) {
    const profile = await this.artworksRepository.findProfileByUserId(artistsId);

    if (!profile) {
      throw new BadRequestException('Profil artist tidak ditemukan.');
    }

    if (profile.strikeCount >= 5) {
      throw new ForbiddenException(
        'Akun Anda telah ditangguhkan karena melanggar aturan TruBrush (Strike Count 5/5). Anda tidak dapat mengunggah karya baru.',
      );
    }

    const fullArtwork = await this.artworksRepository.create(artistsId, dto);
    return this.mapToFrontendArtwork(fullArtwork);
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
    if (filters.page && filters.limit) {
      const [artworks, total] = await Promise.all([
        this.artworksRepository.findAll(filters),
        this.artworksRepository.count(filters),
      ]);
      const totalPages = Math.ceil(total / filters.limit);
      return {
        data: artworks.map((a) => this.mapToFrontendArtwork(a)),
        meta: {
          page: filters.page,
          limit: filters.limit,
          total,
          total_pages: totalPages,
          has_more: filters.page < totalPages,
        },
      };
    }

    const artworks = await this.artworksRepository.findAll(filters);
    return artworks.map((a) => this.mapToFrontendArtwork(a));
  }

  async findOne(id: string) {
    const artwork = await this.artworksRepository.findArtworkById(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    return this.mapToFrontendArtwork(artwork);
  }

  async update(id: string, requesterId: string, requesterRole: string, dto: UpdateArtworkDto) {
    const artwork = await this.artworksRepository.findArtworkByIdRaw(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const isOwner = artwork.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak mengubah artwork ini.');
    }

    const updated = await this.artworksRepository.update(id, dto);
    return this.mapToFrontendArtwork(updated);
  }

  async curate(id: string, reviewerId: string, dto: CurateArtworkDto) {
    const artwork = await this.artworksRepository.findArtworkByIdRaw(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const finalArtwork = await this.artworksRepository.curate(id, reviewerId, dto);
    return this.mapToFrontendArtwork(finalArtwork);
  }

  async remove(id: string, requesterId: string, requesterRole: string) {
    const artwork = await this.artworksRepository.findArtworkByIdRaw(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const isOwner = artwork.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak menghapus artwork ini.');
    }

    await this.artworksRepository.delete(id, artwork.artistsId);
    return { message: 'Artwork berhasil dihapus.' };
  }

  async getPopularTags() {
    return this.artworksRepository.getPopularTags();
  }

  async findAllArtists() {
    const artists = await this.artworksRepository.findAllArtists();

    const mapped = artists.map((a) => {
      return {
        id: a.id,
        user_id: a.id,
        avatar_url: a.profile?.avatarUrl || '',
        bio: a.profile?.bio || '',
        social_links: {
          instagram: a.profile?.instagramUrl || null,
          twitter: a.profile?.twitterUrl || null,
          pixiv: a.profile?.pixivUrl || null,
          website: a.profile?.websiteUrl || null,
        },
        is_verified: a.profile?.isVerified || false,
        is_open_for_commission: a.profile?.isOpenForCommission || false,
        base_price_idr: a.profile?.basePriceIdr || null,
        approved_portfolio_count: a.profile?.approvedPortfolioCount || 0,
        followersCount: a._count.followers || 0,
        user: {
          id: a.id,
          name: a.name,
          role: a.role,
        },
      };
    });

    return mapped.sort((a, b) => {
      if (b.followersCount !== a.followersCount) {
        return b.followersCount - a.followersCount;
      }
      return b.approved_portfolio_count - a.approved_portfolio_count;
    });
  }

  async findPopularArtists() {
    const all = await this.findAllArtists();
    return all.slice(0, 3);
  }

  async findAllTags() {
    const tags = await this.artworksRepository.findAllTags();
    return tags.map((t) => ({
      id: t.id,
      tag_name: t.tagName,
    }));
  }

  async findArtistById(id: string) {
    const artist = await this.artworksRepository.findArtistById(id);

    if (!artist) {
      throw new NotFoundException('Artis tidak ditemukan.');
    }

    return {
      id: artist.id,
      user_id: artist.id,
      avatar_url: artist.profile?.avatarUrl || '',
      bio: artist.profile?.bio || '',
      social_links: {
        instagram: artist.profile?.instagramUrl || null,
        twitter: artist.profile?.twitterUrl || null,
        pixiv: artist.profile?.pixivUrl || null,
        website: artist.profile?.websiteUrl || null,
      },
      is_verified: artist.profile?.isVerified || false,
      is_open_for_commission: artist.profile?.isOpenForCommission || false,
      base_price_idr: artist.profile?.basePriceIdr || null,
      approved_portfolio_count: artist.profile?.approvedPortfolioCount || 0,
      followersCount: artist._count.followers || 0,
      user: {
        id: artist.id,
        name: artist.name,
        email: artist.email,
        role: artist.role,
      },
    };
  }
}
