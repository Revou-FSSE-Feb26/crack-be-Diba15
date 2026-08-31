export interface FavoriteRepositoryInterface {
  findFavorite(userId: string, artworkId: string): Promise<any | null>;
  createFavorite(userId: string, artworkId: string): Promise<any>;
  deleteFavorite(userId: string, artworkId: string): Promise<any>;
  getUserFavorites(userId: string): Promise<any[]>;
  getUserFavoriteArtworkIds(userId: string): Promise<string[]>;
}
