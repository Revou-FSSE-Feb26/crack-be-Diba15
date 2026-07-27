import { Module } from '@nestjs/common';
import { ArtworksModule } from '../artworks/artworks.module';
import { UsersModule } from '../users/users.module';
import { FavoriteRepository } from './favorite.repository';
import { FollowRepository } from './follow.repository';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [ArtworksModule, UsersModule],
  controllers: [SocialController],
  providers: [SocialService, FavoriteRepository, FollowRepository],
  exports: [SocialService, FavoriteRepository, FollowRepository],
})
export class SocialModule {}
