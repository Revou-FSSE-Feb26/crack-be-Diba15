import type { CommissionStatus, PaymentMethod } from '../../generated/prisma/enums';

export interface CommissionsRepositoryInterface {
  createCommission(
    clientId: string,
    data: {
      artistsId: string;
      commissionTitle: string;
      description?: string;
      price: number;
      paymentMethod?: PaymentMethod;
    },
  ): Promise<any>;
  findCommissionsByUser(userId: string, role?: 'client' | 'artist'): Promise<any[]>;
  findAllCommissions(role?: 'client' | 'artist'): Promise<any[]>;
  findCommissionById(id: string): Promise<any | null>;
  respondCommission(id: string, status: CommissionStatus): Promise<any>;
  payCommission(id: string, paymentMethod?: PaymentMethod, cardLastFour?: string): Promise<any>;
  updateProgress(
    commissionId: string,
    data: {
      sketch_url?: string;
      final_artwork_url?: string;
      final_file_url?: string;
    },
  ): Promise<any>;
  approveStep(commissionId: string, step: 'sketch' | 'final'): Promise<any>;
  completeCommission(commissionId: string): Promise<any>;
  addRevision(commissionId: string, userId: string, comment: string): Promise<any>;
  cancelCommission(commissionId: string): Promise<any>;
  findArtistWithProfile(id: string): Promise<any | null>;
  findClientUser(id: string): Promise<any | null>;
  findCommissionProgress(commissionId: string): Promise<any | null>;
}
