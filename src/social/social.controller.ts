import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { SocialService } from './social.service';

@ApiTags('Social')
@ApiBearerAuth('JWT-auth')
@Controller('social')
@UseGuards(JwtAccessGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ─── Favorite Endpoints ───────────────────────────────────────────────────

  @Post('favorite/:artworkId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like / favorite artwork' })
  @ApiResponse({ status: 200, description: 'Status favorite di-toggle' })
  async toggleFavorite(
    @GetCurrentUser('sub') userId: string,
    @Param('artworkId') artworkId: string,
  ) {
    return this.socialService.toggleFavorite(userId, artworkId);
  }

  @Get('favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mendapatkan daftar karya yang disukai oleh user' })
  @ApiResponse({ status: 200, description: 'Daftar karya favorit' })
  async getFavorites(@GetCurrentUser('sub') userId: string) {
    return this.socialService.getFavorites(userId);
  }

  @Get('favorite/ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mendapatkan array ID artwork yang disukai user' })
  @ApiResponse({ status: 200, description: 'Daftar ID favorit' })
  async getFavoriteIds(@GetCurrentUser('sub') userId: string) {
    return this.socialService.getFavoriteIds(userId);
  }

  // ─── Follow Endpoints ─────────────────────────────────────────────────────

  @Post('follow/:artistId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle follow / unfollow artist' })
  @ApiResponse({ status: 200, description: 'Status follow di-toggle' })
  async toggleFollow(
    @GetCurrentUser('sub') followerId: string,
    @Param('artistId') artistId: string,
  ) {
    return this.socialService.toggleFollow(followerId, artistId);
  }

  @Get('following')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mendapatkan daftar artis yang diikuti oleh user' })
  @ApiResponse({ status: 200, description: 'Daftar artis yang diikuti' })
  async getFollowing(@GetCurrentUser('sub') followerId: string) {
    return this.socialService.getFollowing(followerId);
  }

  @Get('following/ids')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mendapatkan array ID artis yang diikuti oleh user' })
  @ApiResponse({ status: 200, description: 'Daftar ID following' })
  async getFollowingIds(@GetCurrentUser('sub') followerId: string) {
    return this.socialService.getFollowingIds(followerId);
  }
}
