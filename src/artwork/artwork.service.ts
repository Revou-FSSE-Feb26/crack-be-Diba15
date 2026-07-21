import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArtworkRepository } from './artwork.repository.js';
import { CreateArtworkDto } from './dto/create-artwork.dto.js';
import { CurateArtworkDto } from './dto/curate-artwork.dto.js';
import { UpdateArtworkDto } from './dto/update-artwork.dto.js';

@Injectable()
export class ArtworkService {
  constructor(private readonly artworkRepository: ArtworkRepository) {}

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

  // ─── Create Artwork ──────────────────────────────────────────────────────────
  async create(artistsId: string, dto: CreateArtworkDto) {
    const profile = await this.artworkRepository.findProfileByUserId(artistsId);

    if (!profile) {
      throw new BadRequestException('Profil artist tidak ditemukan.');
    }

    if (profile.strikeCount >= 5) {
      throw new ForbiddenException(
        'Akun Anda telah ditangguhkan karena melanggar aturan TruBrush (Strike Count 5/5). Anda tidak dapat mengunggah karya baru.',
      );
    }

    const fullArtwork = await this.artworkRepository.create(artistsId, dto);
    return this.mapToFrontendArtwork(fullArtwork);
  }

  // ─── Find All Artworks ──────────────────────────────────────────────────────
  async findAll(filters: {
    search?: string;
    tag?: string;
    artistId?: string;
    curationStatus?: string;
    isVisibleOnFeed?: string;
  }) {
    const artworks = await this.artworkRepository.findAll(filters);
    return artworks.map((a) => this.mapToFrontendArtwork(a));
  }

  // ─── Find One Artwork ───────────────────────────────────────────────────────
  async findOne(id: string) {
    const artwork = await this.artworkRepository.findArtworkById(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    return this.mapToFrontendArtwork(artwork);
  }

  // ─── Update Artwork ─────────────────────────────────────────────────────────
  async update(id: string, requesterId: string, requesterRole: string, dto: UpdateArtworkDto) {
    const artwork = await this.artworkRepository.findArtworkByIdRaw(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const isOwner = artwork.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak mengubah artwork ini.');
    }

    const updated = await this.artworkRepository.update(id, dto);
    return this.mapToFrontendArtwork(updated);
  }

  // ─── Curate/Review Artwork ──────────────────────────────────────────────────
  async curate(id: string, reviewerId: string, dto: CurateArtworkDto) {
    const artwork = await this.artworkRepository.findArtworkByIdRaw(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const finalArtwork = await this.artworkRepository.curate(id, reviewerId, dto);
    return this.mapToFrontendArtwork(finalArtwork);
  }

  // ─── Remove/Delete Artwork ──────────────────────────────────────────────────
  async remove(id: string, requesterId: string, requesterRole: string) {
    const artwork = await this.artworkRepository.findArtworkByIdRaw(id);

    if (!artwork) {
      throw new NotFoundException('Artwork tidak ditemukan.');
    }

    const isOwner = artwork.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak menghapus artwork ini.');
    }

    await this.artworkRepository.delete(id, artwork.artistsId);
    return { message: 'Artwork berhasil dihapus.' };
  }

  // ─── Get Popular Tags ───────────────────────────────────────────────────────
  async getPopularTags() {
    return this.artworkRepository.getPopularTags();
  }

  // ─── Get All Artists ───────────────────────────────────────────────────────
  async findAllArtists() {
    const artists = await this.artworkRepository.findAllArtists();

    const mapped = artists.map((a) => {
      return {
        id: a.id,
        user_id: a.id,
        avatar_url: a.profile?.avatarUrl || '',
        bio: a.profile?.bio || '',
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

  // ─── Get Popular Artists ───────────────────────────────────────────────────
  async findPopularArtists() {
    const all = await this.findAllArtists();
    return all.slice(0, 3);
  }

  // ─── Get All Tags ──────────────────────────────────────────────────────────
  async findAllTags() {
    const tags = await this.artworkRepository.findAllTags();
    return tags.map((t) => ({
      id: t.id,
      tag_name: t.tagName,
    }));
  }

  // ─── Get Single Artist by ID (Public) ──────────────────────────────────────
  async findArtistById(id: string) {
    const artist = await this.artworkRepository.findArtistById(id);

    if (!artist) {
      throw new NotFoundException('Artis tidak ditemukan.');
    }

    return {
      id: artist.id,
      user_id: artist.id,
      avatar_url: artist.profile?.avatarUrl || '',
      bio: artist.profile?.bio || '',
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
