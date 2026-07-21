import { Module } from '@nestjs/common';
import { ArtworkModule } from '../artwork/artwork.module.js';
import { UserModule } from '../user/user.module.js';
import { FavoriteRepository } from './favorite.repository.js';
import { FollowRepository } from './follow.repository.js';
import { SocialController } from './social.controller.js';
import { SocialService } from './social.service.js';

@Module({
  imports: [ArtworkModule, UserModule],
  controllers: [SocialController],
  providers: [SocialService, FavoriteRepository, FollowRepository],
  exports: [SocialService, FavoriteRepository, FollowRepository],
})
export class SocialModule {}
