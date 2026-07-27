import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionsRepository } from './commissions.repository';
import type { CreateCommissionDto } from './dto/create-commission.dto';
import type { CreateRevisionDto } from './dto/create-revision.dto';
import type { RespondCommissionDto } from './dto/respond-commission.dto';
import type { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class CommissionsService {
  constructor(
    private readonly commissionsRepository: CommissionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private mapCommissionResponse(commission: any) {
    if (!commission) return null;
    return {
      id: commission.id,
      artists_id: commission.artistsId,
      client_id: commission.clientId,
      commission_title: commission.commissionTitle,
      description: commission.description,
      price: commission.price,
      status: commission.status,
      payment_status: commission.paymentStatus,
      payment_method: commission.paymentMethod,
      created_at: commission.createdAt.toISOString(),
      updated_at: commission.updatedAt.toISOString(),
      artist: commission.artist
        ? {
            id: commission.artist.id,
            name: commission.artist.name,
            email: commission.artist.email,
            avatar_url: commission.artist.profile?.avatarUrl || null,
            is_verified: commission.artist.profile?.isVerified || false,
            is_open_for_commission: commission.artist.profile?.isOpenForCommission || false,
          }
        : undefined,
      client: commission.client
        ? {
            id: commission.client.id,
            name: commission.client.name,
            email: commission.client.email,
            balance: commission.client.balance,
            avatar_url: commission.client.profile?.avatarUrl || null,
          }
        : undefined,
      progress: commission.progress
        ? {
            id: commission.progress.id,
            sketch_url: commission.progress.sketchUrl || null,
            sketch_approved: commission.progress.sketchApproved,
            final_artwork_url: commission.progress.finalArtworkUrl || null,
            final_artwork_approved: commission.progress.finalArtworkApproved,
            updated_at: commission.progress.updatedAt.toISOString(),
          }
        : undefined,
      revisions: commission.revisions
        ? commission.revisions.map((r: any) => ({
            id: r.id,
            user_id: r.userId,
            comment: r.comment,
            created_at: r.createdAt.toISOString(),
            user: r.user
              ? {
                  id: r.user.id,
                  name: r.user.name,
                  role: r.user.role,
                }
              : undefined,
          }))
        : [],
    };
  }

  async create(clientId: string, dto: CreateCommissionDto) {
    const { artistsId, price } = dto;

    if (clientId === artistsId) {
      throw new BadRequestException('Anda tidak dapat memesan komisi ke diri sendiri.');
    }

    const artist = await this.prisma.user.findFirst({
      where: { id: artistsId, role: 'artist' },
      include: { profile: true },
    });

    if (!artist?.profile) {
      throw new NotFoundException('Artis penerima komisi tidak ditemukan.');
    }

    if (!artist.profile.isOpenForCommission) {
      throw new BadRequestException('Artis ini sedang tidak menerima komisi.');
    }

    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client tidak ditemukan.');
    }

    if (client.balance < price) {
      throw new BadRequestException(
        `Saldo Anda tidak mencukupi untuk memesan komisi ini. Saldo saat ini: Rp${client.balance.toLocaleString()}, harga komisi: Rp${price.toLocaleString()}.`,
      );
    }

    const commission = await this.commissionsRepository.createCommission(clientId, dto);
    return this.mapCommissionResponse(commission);
  }

  async findAllByUser(userId: string, role?: 'client' | 'artist') {
    const commissions = await this.commissionsRepository.findCommissionsByUser(userId, role);
    return commissions.map((c) => this.mapCommissionResponse(c));
  }

  async findOne(id: string, requesterId: string, requesterRole: string) {
    const commission = await this.commissionsRepository.findCommissionById(id);

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    const isClient = commission.clientId === requesterId;
    const isArtist = commission.artistsId === requesterId;
    const isAdmin = requesterRole === 'admin';

    if (!isClient && !isArtist && !isAdmin) {
      throw new ForbiddenException('Anda tidak berhak melihat komisi ini.');
    }

    return this.mapCommissionResponse(commission);
  }

  async respond(id: string, artistId: string, dto: RespondCommissionDto) {
    const commission = await this.commissionsRepository.findCommissionById(id);

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    if (commission.artistsId !== artistId) {
      throw new ForbiddenException('Hanya artis penerima komisi yang dapat menanggapi.');
    }

    if (commission.status !== 'pending') {
      throw new BadRequestException('Komisi ini sudah ditanggapi sebelumnya.');
    }

    const updated = await this.commissionsRepository.respondCommission(id, dto.status);
    return this.mapCommissionResponse(updated);
  }

  async updateProgress(id: string, artistId: string, dto: UpdateProgressDto) {
    const commission = await this.commissionsRepository.findCommissionById(id);

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    if (commission.artistsId !== artistId) {
      throw new ForbiddenException('Hanya artis penerima komisi yang dapat mengunggah progress.');
    }

    if (
      commission.status === 'pending' ||
      commission.status === 'cancelled' ||
      commission.status === 'completed'
    ) {
      throw new BadRequestException(
        `Tidak dapat memperbarui progress untuk komisi dengan status "${commission.status}".`,
      );
    }

    const updated = await this.commissionsRepository.updateProgress(id, dto);
    return this.mapCommissionResponse(updated);
  }

  async approveStep(id: string, clientId: string, step: 'sketch' | 'final') {
    const commission = await this.commissionsRepository.findCommissionById(id);

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    if (commission.clientId !== clientId) {
      throw new ForbiddenException('Hanya client pemesan komisi yang dapat menyetujui progress.');
    }

    if (step === 'sketch' && !commission.progress?.sketchUrl) {
      throw new BadRequestException('Artis belum mengunggah sketsa.');
    }

    if (step === 'final' && !commission.progress?.finalArtworkUrl) {
      throw new BadRequestException('Artis belum mengunggah hasil akhir.');
    }

    const updated = await this.commissionsRepository.approveStep(id, step);
    return this.mapCommissionResponse(updated);
  }

  async addRevision(id: string, userId: string, dto: CreateRevisionDto) {
    const commission = await this.commissionsRepository.findCommissionById(id);

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    const isClient = commission.clientId === userId;
    const isArtist = commission.artistsId === userId;

    if (!isClient && !isArtist) {
      throw new ForbiddenException(
        'Hanya pihak yang terlibat dalam komisi yang dapat meninggalkan komentar.',
      );
    }

    if (commission.status === 'completed' || commission.status === 'cancelled') {
      throw new BadRequestException('Komisi yang sudah selesai/batal tidak dapat direvisi.');
    }

    const updated = await this.commissionsRepository.addRevision(id, userId, dto.comment);
    return this.mapCommissionResponse(updated);
  }

  async cancel(id: string, clientId: string) {
    const commission = await this.commissionsRepository.findCommissionById(id);

    if (!commission) {
      throw new NotFoundException('Komisi tidak ditemukan.');
    }

    if (commission.clientId !== clientId) {
      throw new ForbiddenException('Hanya client pemesan yang dapat membatalkan komisi.');
    }

    if (commission.status === 'completed') {
      throw new BadRequestException('Komisi yang sudah selesai tidak dapat dibatalkan.');
    }

    if (commission.status === 'cancelled') {
      throw new BadRequestException('Komisi ini sudah dibatalkan.');
    }

    const updated = await this.commissionsRepository.cancelCommission(id);
    return this.mapCommissionResponse(updated);
  }
}
