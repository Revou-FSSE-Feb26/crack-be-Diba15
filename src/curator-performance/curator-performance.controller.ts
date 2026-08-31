import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CuratorPerformanceService } from './curator-performance.service';
import { CuratorPerformanceQueryDto } from './dto/curator-performance-query.dto';

@ApiTags('Curator Performance')
@Controller('curator-performance')
export class CuratorPerformanceController {
  constructor(private readonly service: CuratorPerformanceService) {}

  @Get()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mendapatkan laporan metrik kinerja kurasi & SLA moderator (Admin Only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Laporan metrik performa kurator berhasil didapatkan.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPerformanceMetrics(@Query() query: CuratorPerformanceQueryDto) {
    return this.service.getPerformanceMetrics(query);
  }
}
