export interface ArtistsRepositoryInterface {
  findAllArtists(): Promise<any[]>;
  findArtistById(id: string): Promise<any | null>;
}
