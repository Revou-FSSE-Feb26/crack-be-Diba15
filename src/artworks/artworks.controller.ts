import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { ArtworksService } from './artworks.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { CurateArtworkDto } from './dto/curate-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';

@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  // ─── Public Routes ───────────────────────────────────────────────────────────

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('artistId') artistId?: string,
    @Query('curationStatus') curationStatus?: string,
    @Query('isVisibleOnFeed') isVisibleOnFeed?: string,
  ) {
    return this.artworksService.findAll({
      search,
      tag,
      artistId,
      curationStatus,
      isVisibleOnFeed,
    });
  }

  @Get('tags/popular')
  getPopularTags() {
    return this.artworksService.getPopularTags();
  }

  @Get('artists/popular')
  findPopularArtists() {
    return this.artworksService.findPopularArtists();
  }

  @Get('artists')
  findAllArtists() {
    return this.artworksService.findAllArtists();
  }

  @Get('artists/:id')
  findArtistById(@Param('id') id: string) {
    return this.artworksService.findArtistById(id);
  }

  @Get('tags')
  findAllTags() {
    return this.artworksService.findAllTags();
  }

  // ─── Curator & Admin Routes ──────────────────────────────────────────────────

  @Get('pending')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('curator', 'admin')
  findPending() {
    return this.artworksService.findAll({
      curationStatus: 'pending',
    });
  }

  // ─── Dynamic Public Route ───────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artworksService.findOne(id);
  }

  // ─── Artist / Owner Routes ──────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('artist')
  create(@GetCurrentUser('sub') artistId: string, @Body() dto: CreateArtworkDto) {
    return this.artworksService.create(artistId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  update(
    @Param('id') id: string,
    @GetCurrentUser() requester: JwtPayload,
    @Body() dto: UpdateArtworkDto,
  ) {
    return this.artworksService.update(id, requester.sub, requester.role, dto);
  }

  @Patch(':id/curate')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('curator', 'admin')
  curate(
    @Param('id') id: string,
    @GetCurrentUser('sub') reviewerId: string,
    @Body() dto: CurateArtworkDto,
  ) {
    return this.artworksService.curate(id, reviewerId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  remove(@Param('id') id: string, @GetCurrentUser() requester: JwtPayload) {
    return this.artworksService.remove(id, requester.sub, requester.role);
  }
}
