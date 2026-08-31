import type { AppealStatus } from '../../generated/prisma/enums';

export interface CreateAppealInput {
  artistId: string;
  reason: string;
}

export interface ResolveAppealInput {
  status: AppealStatus;
  resolvedById: string;
  resolutionNotes?: string;
}

export interface AppealFilterInput {
  status?: AppealStatus;
  artistId?: string;
  page?: number;
  limit?: number;
}

export interface AppealsRepositoryInterface {
  create(data: CreateAppealInput): Promise<any>;
  findAll(filter?: AppealFilterInput): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findPendingByArtistId(artistId: string): Promise<any | null>;
  findByArtistId(artistId: string): Promise<any[]>;
  update(id: string, data: ResolveAppealInput): Promise<any>;
  resetArtistStrikeCount(artistId: string): Promise<void>;
}
