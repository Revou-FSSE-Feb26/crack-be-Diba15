import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async update(userId: string, dto: UpdateProfileDto) {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Profil tidak ditemukan.');
    }

    return this.profileRepository.update(userId, dto);
  }
}
