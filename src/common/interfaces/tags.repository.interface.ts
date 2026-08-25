export interface TagsRepositoryInterface {
  getPopularTags(): Promise<any[]>;
  findAllTags(): Promise<any[]>;
}
