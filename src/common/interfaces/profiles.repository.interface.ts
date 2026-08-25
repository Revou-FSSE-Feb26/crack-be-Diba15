import type { Prisma } from '../../generated/prisma/client';

export interface ProfilesRepositoryInterface {
  findByUserId(userId: string): Promise<any | null>;
  update(userId: string, data: Prisma.ProfileUpdateInput): Promise<any>;
  updateAvatarUrl(userId: string, avatarUrl: string): Promise<any>;
}
