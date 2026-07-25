import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { SocialService } from './social.service';

@Controller('social')
@UseGuards(JwtAccessGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ─── Favorite Endpoints ───────────────────────────────────────────────────

  @Post('favorite/:artworkId')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @GetCurrentUser('sub') userId: string,
    @Param('artworkId') artworkId: string,
  ) {
    return this.socialService.toggleFavorite(userId, artworkId);
  }

  @Get('favorite')
  @HttpCode(HttpStatus.OK)
  async getFavorites(@GetCurrentUser('sub') userId: string) {
    return this.socialService.getFavorites(userId);
  }

  @Get('favorite/ids')
  @HttpCode(HttpStatus.OK)
  async getFavoriteIds(@GetCurrentUser('sub') userId: string) {
    return this.socialService.getFavoriteIds(userId);
  }

  // ─── Follow Endpoints ─────────────────────────────────────────────────────

  @Post('follow/:artistId')
  @HttpCode(HttpStatus.OK)
  async toggleFollow(
    @GetCurrentUser('sub') followerId: string,
    @Param('artistId') artistId: string,
  ) {
    return this.socialService.toggleFollow(followerId, artistId);
  }

  @Get('following')
  @HttpCode(HttpStatus.OK)
  async getFollowing(@GetCurrentUser('sub') followerId: string) {
    return this.socialService.getFollowing(followerId);
  }

  @Get('following/ids')
  @HttpCode(HttpStatus.OK)
  async getFollowingIds(@GetCurrentUser('sub') followerId: string) {
    return this.socialService.getFollowingIds(followerId);
  }
}
