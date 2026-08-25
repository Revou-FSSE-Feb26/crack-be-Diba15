import type { DisputeStatus } from '../../generated/prisma/enums';

export interface DisputesRepositoryInterface {
  createDispute(commissionId: string, reason: string): Promise<any>;
  findAllDisputes(status?: DisputeStatus): Promise<any[]>;
  findDisputeById(id: string): Promise<any | null>;
  findDisputeByCommissionId(commissionId: string): Promise<any | null>;
  resolveDispute(id: string, mediatorId: string, status: DisputeStatus): Promise<any>;
  findCommissionById(id: string): Promise<any | null>;
}
