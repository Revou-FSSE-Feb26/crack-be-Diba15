import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { ReportStatus } from '../generated/prisma/enums';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAccessGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@GetCurrentUser('sub') reporterId: string, @Body() dto: CreateReportDto) {
    return this.reportsService.create(reporterId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  findAll(@Query('status') status?: ReportStatus) {
    return this.reportsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  resolve(
    @Param('id') id: string,
    @GetCurrentUser('sub') curatorId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, curatorId, dto);
  }
}
