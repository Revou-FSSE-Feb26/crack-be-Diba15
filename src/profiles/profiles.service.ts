import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesRepository } from './profiles.repository';

@Injectable()
export class ProfilesService {
  constructor(private readonly profilesRepository: ProfilesRepository) {}

  async update(userId: string, dto: UpdateProfileDto) {
    const profile = await this.profilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profil tidak ditemukan.');
    }

    return this.profilesRepository.update(userId, dto);
  }
}
