export interface TagsRepositoryInterface {
  getPopularTags(): Promise<any[]>;
  findAllTags(): Promise<any[]>;
  findTagById(id: string): Promise<any | null>;
  findTagByName(name: string): Promise<any | null>;
  createTag(name: string): Promise<any>;
  updateTag(id: string, name: string): Promise<any>;
  deleteTag(id: string): Promise<any>;
}
