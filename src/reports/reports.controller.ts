import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { ReportStatus } from '../generated/prisma/enums';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAccessGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Melaporkan artwork yang melanggar (AI-generated / plagiarisme)' })
  @ApiResponse({ status: 201, description: 'Laporan berhasil dibuat' })
  create(@GetCurrentUser('sub') reporterId: string, @Body() dto: CreateReportDto) {
    return this.reportsService.create(reporterId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  @ApiOperation({ summary: 'Melihat seluruh daftar laporan pelanggaran (Kurator / Admin)' })
  @ApiResponse({ status: 200, description: 'Daftar laporan' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query('status') status?: ReportStatus) {
    return this.reportsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail laporan pelanggaran' })
  @ApiResponse({ status: 200, description: 'Detail laporan' })
  @ApiResponse({ status: 404, description: 'Laporan tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  @ApiOperation({ summary: 'Menyelesaikan laporan pelanggaran (Kurator / Admin)' })
  @ApiResponse({ status: 200, description: 'Laporan diselesaikan' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  resolve(
    @Param('id') id: string,
    @GetCurrentUser('sub') curatorId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, curatorId, dto);
  }
}
