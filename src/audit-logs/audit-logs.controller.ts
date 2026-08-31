import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(JwtAccessGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'curator')
  @ApiOperation({
    summary:
      'Melihat rekam jejak kronologis log audit moderasi staf (Kurasi, Laporan, Dispute, Banding Akun)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar log audit moderasi terpaginasi',
  })
  @ApiResponse({ status: 403, description: 'Hanya Admin dan Kurator yang memiliki akses' })
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditLogsService.findAll(query);
  }
}
