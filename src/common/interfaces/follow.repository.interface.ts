export interface FollowRepositoryInterface {
  findFollow(followerId: string, artistId: string): Promise<any | null>;
  createFollow(followerId: string, artistId: string): Promise<any>;
  deleteFollow(followerId: string, artistId: string): Promise<any>;
  getUserFollowing(followerId: string): Promise<any[]>;
  getUserFollowingArtistIds(followerId: string): Promise<string[]>;
}
