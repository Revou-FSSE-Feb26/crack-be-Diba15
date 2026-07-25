import { Module } from '@nestjs/common';
import { ArtworkModule } from '../artwork/artwork.module';
import { UserModule } from '../user/user.module';
import { FavoriteRepository } from './favorite.repository';
import { FollowRepository } from './follow.repository';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [ArtworkModule, UserModule],
  controllers: [SocialController],
  providers: [SocialService, FavoriteRepository, FollowRepository],
  exports: [SocialService, FavoriteRepository, FollowRepository],
})
export class SocialModule {}
