import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { CreateRevisionDto } from './dto/create-revision.dto';
import { RespondCommissionDto } from './dto/respond-commission.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('commissions')
@UseGuards(JwtAccessGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  /**
   * POST /api/commissions
   * Client memesan komisi baru (memotong saldo escrow).
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('client')
  create(@GetCurrentUser('sub') clientId: string, @Body() dto: CreateCommissionDto) {
    return this.commissionsService.create(clientId, dto);
  }

  /**
   * GET /api/commissions
   * Melihat daftar komisi milik pengguna (bisa di-filter berdasarkan @Query('as') role = 'client' | 'artist').
   */
  @Get()
  findAll(@GetCurrentUser('sub') userId: string, @Query('as') role?: 'client' | 'artist') {
    return this.commissionsService.findAllByUser(userId, role);
  }

  /**
   * GET /api/commissions/:id
   * Detail komisi beserta progress dan revisi.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @GetCurrentUser() requester: JwtPayload) {
    return this.commissionsService.findOne(id, requester.sub, requester.role);
  }

  /**
   * PATCH /api/commissions/:id/respond
   * Artis menerima atau menolak pesanan komisi.
   */
  @Patch(':id/respond')
  @UseGuards(RolesGuard)
  @Roles('artist')
  respond(
    @Param('id') id: string,
    @GetCurrentUser('sub') artistId: string,
    @Body() dto: RespondCommissionDto,
  ) {
    return this.commissionsService.respond(id, artistId, dto);
  }

  /**
   * PATCH /api/commissions/:id/progress
   * Artis memperbarui sketsa (sketchUrl) atau hasil akhir (finalArtworkUrl).
   */
  @Patch(':id/progress')
  @UseGuards(RolesGuard)
  @Roles('artist')
  updateProgress(
    @Param('id') id: string,
    @GetCurrentUser('sub') artistId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.commissionsService.updateProgress(id, artistId, dto);
  }

  /**
   * PATCH /api/commissions/:id/approve
   * Client menyetujui sketsa (step=sketch) atau hasil akhir (step=final).
   */
  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('client')
  approveStep(
    @Param('id') id: string,
    @GetCurrentUser('sub') clientId: string,
    @Body('step') step: 'sketch' | 'final',
  ) {
    return this.commissionsService.approveStep(id, clientId, step);
  }

  /**
   * POST /api/commissions/:id/revisions
   * Menambahkan komentar revisi.
   */
  @Post(':id/revisions')
  addRevision(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateRevisionDto,
  ) {
    return this.commissionsService.addRevision(id, userId, dto);
  }

  /**
   * PATCH /api/commissions/:id/cancel
   * Client membatalkan komisi (refund saldo).
   */
  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('client')
  cancel(@Param('id') id: string, @GetCurrentUser('sub') clientId: string) {
    return this.commissionsService.cancel(id, clientId);
  }
}
