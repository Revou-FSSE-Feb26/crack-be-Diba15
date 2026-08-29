import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AppealsRepositoryInterface } from '../common/interfaces/appeals.repository.interface';
import type { AppealStatus } from '../generated/prisma/enums';
import type { CreateAppealDto } from './dto/create-appeal.dto';
import type { ResolveAppealDto } from './dto/resolve-appeal.dto';

@Injectable()
export class AppealsService {
  constructor(
    @Inject('IAppealsRepository')
    private readonly appealsRepo: AppealsRepositoryInterface,
  ) {}

  async create(artistId: string, dto: CreateAppealDto) {
    const trimmedReason = dto.reason.trim();
    if (trimmedReason.length < 30) {
      throw new BadRequestException('Alasan banding minimal harus 30 karakter.');
    }

    const existingPending = await this.appealsRepo.findPendingByArtistId(artistId);
    if (existingPending) {
      throw new BadRequestException('Anda sudah memiliki pengajuan banding yang sedang ditinjau.');
    }

    return this.appealsRepo.create({
      artistId,
      reason: trimmedReason,
    });
  }

  async findAll(status?: AppealStatus) {
    return this.appealsRepo.findAll({ status });
  }

  async findMy(artistId: string) {
    return this.appealsRepo.findByArtistId(artistId);
  }

  async findOne(id: string) {
    const appeal = await this.appealsRepo.findById(id);
    if (!appeal) {
      throw new NotFoundException('Pengajuan banding tidak ditemukan.');
    }
    return appeal;
  }

  async resolve(id: string, adminId: string, dto: ResolveAppealDto) {
    const appeal = await this.appealsRepo.findById(id);
    if (!appeal) {
      throw new NotFoundException('Pengajuan banding tidak ditemukan.');
    }

    if (appeal.status !== 'pending') {
      throw new BadRequestException('Pengajuan banding ini sudah diproses sebelumnya.');
    }

    const newStatus: AppealStatus = dto.approved ? 'approved' : 'rejected';

    const resolvedAppeal = await this.appealsRepo.update(id, {
      status: newStatus,
      resolvedById: adminId,
      resolutionNotes: dto.resolutionNotes,
    });

    if (dto.approved) {
      await this.appealsRepo.resetArtistStrikeCount(appeal.artistId);
    }

    return resolvedAppeal;
  }
}
