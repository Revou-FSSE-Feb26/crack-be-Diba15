import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { ReportStatus } from '../generated/prisma/enums';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportService } from './report.service';

@Controller('report')
@UseGuards(JwtAccessGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ─── User (Client & Artist) Routes ──────────────────────────────────────────

  /**
   * POST /api/report
   * Membuat laporan baru terhadap artwork/artist.
   */
  @Post()
  create(@GetCurrentUser('sub') reporterId: string, @Body() dto: CreateReportDto) {
    return this.reportService.create(reporterId, dto);
  }

  // ─── Curator & Admin Routes ────────────────────────────────────────────────

  /**
   * GET /api/report
   * Mengambil daftar laporan (khusus Kurator & Admin). Bisa di-filter dengan query status (pending, resolved, dismissed).
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  findAll(@Query('status') status?: ReportStatus) {
    return this.reportService.findAll(status);
  }

  /**
   * GET /api/report/:id
   * Detail laporan.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  /**
   * PATCH /api/report/:id/resolve
   * Memproses laporan (disetujui / ditolak) oleh Kurator atau Admin.
   */
  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  resolve(
    @Param('id') id: string,
    @GetCurrentUser('sub') curatorId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportService.resolve(id, curatorId, dto);
  }
}
