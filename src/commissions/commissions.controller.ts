import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Commissions')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Client memesan komisi baru' })
  @ApiResponse({ status: 201, description: 'Komisi berhasil dibuat' })
  create(@GetCurrentUser('sub') clientId: string, @Body() dto: CreateCommissionDto) {
    return this.commissionsService.create(clientId, dto);
  }

  /**
   * GET /api/commissions
   * Melihat daftar komisi milik pengguna (bisa di-filter berdasarkan @Query('as') role = 'client' | 'artist').
   */
  @Get()
  @ApiOperation({ summary: 'Melihat daftar komisi pengguna' })
  @ApiResponse({ status: 200, description: 'Daftar komisi' })
  findAll(@GetCurrentUser('sub') userId: string, @Query('as') role?: 'client' | 'artist') {
    return this.commissionsService.findAllByUser(userId, role);
  }

  /**
   * GET /api/commissions/:id
   * Detail komisi beserta progress dan revisi.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Detail pesanan komisi' })
  @ApiResponse({ status: 200, description: 'Detail komisi' })
  @ApiResponse({ status: 404, description: 'Komisi tidak ditemukan' })
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
  @ApiOperation({ summary: 'Artis menerima / menolak komisi' })
  @ApiResponse({ status: 200, description: 'Status komisi diperbarui' })
  respond(
    @Param('id') id: string,
    @GetCurrentUser('sub') artistId: string,
    @Body() dto: RespondCommissionDto,
  ) {
    return this.commissionsService.respond(id, artistId, dto);
  }

  /**
   * PATCH /api/commissions/:id/pay
   * Client melakukan pembayaran komisi setelah diterima oleh artist.
   */
  @Patch(':id/pay')
  @UseGuards(RolesGuard)
  @Roles('client')
  @ApiOperation({ summary: 'Client membayar dana komisi ke Escrow' })
  @ApiResponse({ status: 200, description: 'Pembayaran berhasil' })
  pay(
    @Param('id') id: string,
    @GetCurrentUser('sub') clientId: string,
    @Body() body: { paymentMethod?: any; cardLastFour?: string },
  ) {
    return this.commissionsService.pay(id, clientId, body.paymentMethod, body.cardLastFour);
  }

  /**
   * PATCH /api/commissions/:id/progress
   * Artis memperbarui sketsa (sketchUrl) atau hasil akhir (finalArtworkUrl).
   */
  @Patch(':id/progress')
  @UseGuards(RolesGuard)
  @Roles('artist')
  @ApiOperation({ summary: 'Artis memperbarui progress komisi (sketsa / final artwork)' })
  @ApiResponse({ status: 200, description: 'Progress diperbarui' })
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
  @ApiOperation({ summary: 'Client menyetujui tahapan sketsa / preview hasil akhir' })
  @ApiResponse({ status: 200, description: 'Tahapan komisi disetujui' })
  approveStep(
    @Param('id') id: string,
    @GetCurrentUser('sub') clientId: string,
    @Body('step') step: 'sketch' | 'final',
  ) {
    return this.commissionsService.approveStep(id, clientId, step);
  }

  /**
   * PATCH /api/commissions/:id/complete
   * Artis menyelesaikan komisi dan melepaskan dana escrow setelah mengunggah berkas akhir.
   */
  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles('artist')
  @ApiOperation({ summary: 'Artis menyelesaikan komisi dan melepaskan dana escrow' })
  @ApiResponse({ status: 200, description: 'Komisi selesai dan dana ditransfer' })
  completeCommission(@Param('id') id: string, @GetCurrentUser('sub') artistId: string) {
    return this.commissionsService.completeCommission(id, artistId);
  }

  /**
   * POST /api/commissions/:id/revisions
   * Menambahkan komentar revisi.
   */
  @Post(':id/revisions')
  @ApiOperation({ summary: 'Menambahkan feedback revisi komisi' })
  @ApiResponse({ status: 201, description: 'Revisi dicatat' })
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
  @ApiOperation({ summary: 'Client membatalkan pesanan komisi (refund escrow)' })
  @ApiResponse({ status: 200, description: 'Komisi dibatalkan' })
  cancel(@Param('id') id: string, @GetCurrentUser('sub') clientId: string) {
    return this.commissionsService.cancel(id, clientId);
  }
}
