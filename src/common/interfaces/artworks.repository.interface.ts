import type { CreateArtworkDto } from '../../artworks/dto/create-artwork.dto';
import type { CurateArtworkDto } from '../../artworks/dto/curate-artwork.dto';
import type { UpdateArtworkDto } from '../../artworks/dto/update-artwork.dto';

export interface ArtworksRepositoryInterface {
  findProfileByUserId(userId: string): Promise<any | null>;
  findArtworkByIdRaw(id: string): Promise<any | null>;
  findArtworkById(id: string): Promise<any | null>;
  create(artistsId: string, dto: CreateArtworkDto): Promise<any>;
  findAll(filters: {
    search?: string;
    tag?: string;
    artistId?: string;
    curationStatus?: string;
    isVisibleOnFeed?: string;
    page?: number;
    limit?: number;
  }): Promise<any[]>;
  count(filters: {
    search?: string;
    tag?: string;
    artistId?: string;
    curationStatus?: string;
    isVisibleOnFeed?: string;
  }): Promise<number>;
  curate(id: string, reviewerId: string, dto: CurateArtworkDto): Promise<any>;
  update(id: string, dto: UpdateArtworkDto): Promise<any>;
  delete(id: string, artistId: string): Promise<any>;
}
