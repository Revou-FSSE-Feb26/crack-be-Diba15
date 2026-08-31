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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { ArtworksService } from './artworks.service';
import { CreateArtworkDto } from './dto/create-artwork.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { CurateArtworkDto } from './dto/curate-artwork.dto';
import { UpdateArtworkDto } from './dto/update-artwork.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('Artworks')
@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  // ─── Public Routes ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar karya seni dengan filter dan pagination' })
  @ApiResponse({ status: 200, description: 'Daftar karya seni berhasil didapatkan' })
  findAll(
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('artistId') artistId?: string,
    @Query('curationStatus') curationStatus?: string,
    @Query('isVisibleOnFeed') isVisibleOnFeed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : undefined;
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined;

    return this.artworksService.findAll({
      search,
      tag,
      artistId,
      curationStatus,
      isVisibleOnFeed,
      page: pageNum && !Number.isNaN(pageNum) ? pageNum : undefined,
      limit: limitNum && !Number.isNaN(limitNum) ? limitNum : undefined,
    });
  }

  @Get('tags/popular')
  @ApiOperation({ summary: 'Mendapatkan daftar tag terpopuler' })
  @ApiResponse({ status: 200, description: 'Daftar tag populer' })
  getPopularTags() {
    return this.artworksService.getPopularTags();
  }

  @Get('artists/popular')
  @ApiOperation({ summary: 'Mendapatkan daftar artis terpopuler' })
  @ApiResponse({ status: 200, description: 'Daftar artis populer' })
  findPopularArtists() {
    return this.artworksService.findPopularArtists();
  }

  @Get('artists')
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar artis' })
  @ApiResponse({ status: 200, description: 'Daftar artis' })
  findAllArtists() {
    return this.artworksService.findAllArtists();
  }

  @Get('artists/:id')
  @ApiOperation({ summary: 'Mendapatkan detail profil artis berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail artis' })
  @ApiResponse({ status: 404, description: 'Artis tidak ditemukan' })
  findArtistById(@Param('id') id: string) {
    return this.artworksService.findArtistById(id);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Mendapatkan seluruh tag' })
  @ApiResponse({ status: 200, description: 'Daftar tag' })
  findAllTags() {
    return this.artworksService.findAllTags();
  }

  @Post('tags')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Menambahkan master tag baru (Admin)' })
  @ApiResponse({ status: 201, description: 'Tag berhasil dibuat' })
  @ApiResponse({ status: 409, description: 'Tag sudah terdaftar' })
  createTag(@Body() dto: CreateTagDto) {
    return this.artworksService.createTag(dto);
  }

  @Patch('tags/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mengubah nama master tag (Admin)' })
  @ApiResponse({ status: 200, description: 'Tag berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Tag tidak ditemukan' })
  updateTag(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.artworksService.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Menghapus master tag (Admin)' })
  @ApiResponse({ status: 200, description: 'Tag berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Tag tidak ditemukan' })
  deleteTag(@Param('id') id: string) {
    return this.artworksService.deleteTag(id);
  }

  // ─── Curator & Admin Routes ──────────────────────────────────────────────────

  @Get('pending')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('curator', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mendapatkan karya seni yang menunggu kurasi' })
  @ApiResponse({ status: 200, description: 'Daftar pending kurasi' })
  @ApiResponse({ status: 403, description: 'Forbidden: Kurator / Admin only' })
  findPending() {
    return this.artworksService.findAll({
      curationStatus: 'pending',
    });
  }

  // ─── Dynamic Public Route ───────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail karya seni berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail karya seni' })
  @ApiResponse({ status: 404, description: 'Artwork tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.artworksService.findOne(id);
  }

  // ─── Artist / Owner Routes ──────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('artist')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mengunggah karya seni baru (Artist)' })
  @ApiResponse({ status: 201, description: 'Artwork berhasil diunggah' })
  @ApiResponse({ status: 403, description: 'Forbidden: Artist only' })
  create(@GetCurrentUser('sub') artistId: string, @Body() dto: CreateArtworkDto) {
    return this.artworksService.create(artistId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Memperbarui detail karya seni' })
  @ApiResponse({ status: 200, description: 'Artwork berhasil diperbarui' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Melakukan kurasi artwork (Approve / Reject)' })
  @ApiResponse({ status: 200, description: 'Hasil kurasi disimpan' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  curate(
    @Param('id') id: string,
    @GetCurrentUser('sub') reviewerId: string,
    @Body() dto: CurateArtworkDto,
  ) {
    return this.artworksService.curate(id, reviewerId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Menghapus karya seni' })
  @ApiResponse({ status: 200, description: 'Artwork berhasil dihapus' })
  remove(@Param('id') id: string, @GetCurrentUser() requester: JwtPayload) {
    return this.artworksService.remove(id, requester.sub, requester.role);
  }
}
