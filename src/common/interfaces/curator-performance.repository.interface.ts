export interface CuratorPerformanceFilter {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CuratorRawUser {
  id: string;
  name: string;
  email: string;
  role: string;
  profile?: {
    avatarUrl: string | null;
    isVerified: boolean;
  } | null;
}

export interface ReviewedArtworkRaw {
  id: string;
  title: string;
  curationStatus: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface ResolvedDisputeRaw {
  id: string;
  mediatorId: string | null;
  status: string;
  createdAt: Date;
}

export interface ResolvedReportRaw {
  id: string;
  curatorId: string | null;
  status: string;
  createdAt: Date;
}

export interface CuratorPerformanceRawData {
  curators: CuratorRawUser[];
  artworks: ReviewedArtworkRaw[];
  disputes: ResolvedDisputeRaw[];
  reports: ResolvedReportRaw[];
}

export interface CuratorPerformanceRepositoryInterface {
  getRawPerformanceData(filter?: CuratorPerformanceFilter): Promise<CuratorPerformanceRawData>;
}
