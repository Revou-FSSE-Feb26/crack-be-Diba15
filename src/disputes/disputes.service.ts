import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DisputeStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { DisputesRepository } from './disputes.repository';
import type { CreateDisputeDto } from './dto/create-dispute.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly disputesRepository: DisputesRepository,
    private readonly prisma: PrismaService,
  ) {}

  private mapDisputeResponse(dispute: any) {
    if (!dispute) return null;
    return {
      id: dispute.id,
      commission_id: dispute.commissionId,
      reason: dispute.reason,
      status: dispute.status,
      mediator_id: dispute.mediatorId || null,
      created_at: dispute.createdAt.toISOString(),
      mediator: dispute.mediator
        ? {
            id: dispute.mediator.id,
            name: dispute.mediator.name,
            email: dispute.mediator.email,
            role: dispute.mediator.role,
          }
        : undefined,
      progress: dispute.commission?.progress
        ? {
            id: dispute.commission.progress.id,
            sketch_url: dispute.commission.progress.sketchUrl || null,
            sketch_approved: dispute.commission.progress.sketchApproved,
            final_artwork_url: dispute.commission.progress.finalArtworkUrl || null,
            final_artwork_approved: dispute.commission.progress.finalArtworkApproved,
            updated_at: dispute.commission.progress.updatedAt.toISOString(),
          }
        : undefined,
      commission: dispute.commission
        ? {
            id: dispute.commission.id,
            artists_id: dispute.commission.artistsId,
            client_id: dispute.commission.clientId,
            commission_title: dispute.commission.commissionTitle,
            description: dispute.commission.description,
            price: dispute.commission.price,
            status: dispute.commission.status,
            payment_status: dispute.commission.paymentStatus,
            payment_method: dispute.commission.paymentMethod,
            progress: dispute.commission.progress
              ? {
                  id: dispute.commission.progress.id,
                  sketch_url: dispute.commission.progress.sketchUrl || null,
                  sketch_approved: dispute.commission.progress.sketchApproved,
                  final_artwork_url: dispute.commission.progress.finalArtworkUrl || null,
                  final_artwork_approved: dispute.commission.progress.finalArtworkApproved,
                  updated_at: dispute.commission.progress.updatedAt.toISOString(),
                }
              : undefined,
            artist: dispute.commission.artist
              ? {
                  id: dispute.commission.artist.id,
                  name: dispute.commission.artist.name,
                  email: dispute.commission.artist.email,
                  avatar_url: dispute.commission.artist.profile?.avatarUrl || null,
                }
              : undefined,
            client: dispute.commission.client
              ? {
                  id: dispute.commission.client.id,
                  name: dispute.commission.client.name,
                  email: dispute.commission.client.email,
                  avatar_url: dispute.commission.client.profile?.avatarUrl || null,
                }
              : undefined,
          }
        : undefined,
    };
  }

  async create(reporterId: string, dto: CreateDisputeDto) {
    const { commissionId, reason } = dto;

    const commission = await this.prisma.commission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    const isClient = commission.clientId === reporterId;
    const isArtist = commission.artistsId === reporterId;

    if (!isClient && !isArtist) {
      throw new ForbiddenException(
        'Hanya pihak yang terlibat dalam komisi yang dapat mengajukan sengketa.',
      );
    }

    if (commission.status === 'completed' || commission.status === 'cancelled') {
      throw new BadRequestException(
        'Komisi yang sudah selesai atau dibatalkan tidak dapat disengketakan.',
      );
    }

    const existingDispute = await this.disputesRepository.findDisputeByCommissionId(commissionId);
    if (existingDispute) {
      throw new BadRequestException('Sengketa untuk komisi ini sudah diajukan sebelumnya.');
    }

    const dispute = await this.disputesRepository.createDispute(commissionId, reason);
    return this.mapDisputeResponse(dispute);
  }

  async findAll(status?: DisputeStatus) {
    const disputes = await this.disputesRepository.findAllDisputes(status);
    return disputes.map((d) => this.mapDisputeResponse(d));
  }

  async findOne(id: string, requesterId: string, requesterRole: string) {
    const dispute = await this.disputesRepository.findDisputeById(id);

    if (!dispute) {
      throw new NotFoundException('Sengketa tidak ditemukan.');
    }

    const isClient = dispute.commission?.clientId === requesterId;
    const isArtist = dispute.commission?.artistsId === requesterId;
    const isCuratorOrAdmin = requesterRole === 'curator' || requesterRole === 'admin';

    if (!isClient && !isArtist && !isCuratorOrAdmin) {
      throw new ForbiddenException('Anda tidak berhak melihat sengketa ini.');
    }

    return this.mapDisputeResponse(dispute);
  }

  async resolve(id: string, mediatorId: string, dto: ResolveDisputeDto) {
    const existing = await this.disputesRepository.findDisputeById(id);

    if (!existing) {
      throw new NotFoundException('Sengketa tidak ditemukan.');
    }

    if (existing.status !== 'pending') {
      throw new BadRequestException(
        `Sengketa ini sudah diproses dengan keputusan "${existing.status}".`,
      );
    }

    if (dto.status === 'pending') {
      throw new BadRequestException('Keputusan sengketa harus "approved" atau "rejected".');
    }

    const updated = await this.disputesRepository.resolveDispute(id, mediatorId, dto.status);
    return this.mapDisputeResponse(updated);
  }
}
