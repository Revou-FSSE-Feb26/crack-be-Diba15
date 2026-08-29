export type AuditLogCategory = 'curation' | 'report' | 'dispute' | 'appeal' | 'all';

export interface AuditLogActor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditLogItemResult {
  id: string;
  category: 'curation' | 'report' | 'dispute' | 'appeal';
  action: string;
  actor: AuditLogActor;
  targetType: string;
  targetId: string;
  targetTitle?: string | null;
  details?: string | null;
  status: string;
  createdAt: Date;
}

export interface AuditLogFilterInput {
  category?: AuditLogCategory;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsRepositoryInterface {
  findAll(filter?: AuditLogFilterInput): Promise<{
    data: AuditLogItemResult[];
    total: number;
    page: number;
    limit: number;
  }>;
}
