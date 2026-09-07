import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check status sistem dan koneksi database' })
  @ApiResponse({
    status: 200,
    description: 'Sistem dan koneksi database berjalan normal',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Koneksi database terputus atau mengalami gangguan',
  })
  check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
