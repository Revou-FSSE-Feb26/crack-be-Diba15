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
import { ArtworkService } from './artwork.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { CurateArtworkDto } from './dto/curate-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';

@Controller('artwork')
export class ArtworkController {
  constructor(private readonly artworkService: ArtworkService) {}

  // ─── Public Routes (Bisa diakses Guest / Tanpa Login) ───────────────────────

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('artistId') artistId?: string,
    @Query('curationStatus') curationStatus?: string,
    @Query('isVisibleOnFeed') isVisibleOnFeed?: string,
  ) {
    return this.artworkService.findAll({
      search,
      tag,
      artistId,
      curationStatus,
      isVisibleOnFeed,
    });
  }

  @Get('tags/popular')
  getPopularTags() {
    return this.artworkService.getPopularTags();
  }

  @Get('artists/popular')
  findPopularArtists() {
    return this.artworkService.findPopularArtists();
  }

  @Get('artists')
  findAllArtists() {
    return this.artworkService.findAllArtists();
  }

  @Get('artists/:id')
  findArtistById(@Param('id') id: string) {
    return this.artworkService.findArtistById(id);
  }

  @Get('tags')
  findAllTags() {
    return this.artworkService.findAllTags();
  }

  // ─── Curator & Admin Routes (Terproteksi Guard & Role) ───────────────────────

  @Get('pending')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('curator', 'admin')
  findPending() {
    return this.artworkService.findAll({
      curationStatus: 'pending',
    });
  }

  // ─── Dynamic Public Route (Harus di bawah route static) ─────────────────────

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artworkService.findOne(id);
  }

  // ─── Artist / Owner Routes (Terproteksi Guard) ──────────────────────────────

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('artist')
  create(@GetCurrentUser('sub') artistId: string, @Body() dto: CreateArtworkDto) {
    return this.artworkService.create(artistId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  update(
    @Param('id') id: string,
    @GetCurrentUser() requester: JwtPayload,
    @Body() dto: UpdateArtworkDto,
  ) {
    return this.artworkService.update(id, requester.sub, requester.role, dto);
  }

  @Patch(':id/curate')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('curator', 'admin')
  curate(
    @Param('id') id: string,
    @GetCurrentUser('sub') reviewerId: string,
    @Body() dto: CurateArtworkDto,
  ) {
    return this.artworkService.curate(id, reviewerId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  remove(@Param('id') id: string, @GetCurrentUser() requester: JwtPayload) {
    return this.artworkService.remove(id, requester.sub, requester.role);
  }
}
