import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppealStatus } from '../generated/prisma/enums';
import { AppealsService } from './appeals.service';
import { AppealResponseDto } from './dto/appeal-response.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';

@ApiTags('Appeals')
@ApiBearerAuth('JWT-auth')
@Controller('appeals')
@UseGuards(JwtAccessGuard)
export class AppealsController {
  constructor(private readonly appealsService: AppealsService) {}

  @Throttle({ default: { limit: 2, ttl: 60 * 1000 } })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('artist')
  @ApiOperation({
    summary: 'Mengajukan permohonan banding pemulihan akun artist yang terkena sanksi/strike',
  })
  @ApiResponse({
    status: 201,
    description: 'Permohonan banding berhasil dikirim',
    type: AppealResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validasi gagal atau sudah ada banding yang pending' })
  @ApiResponse({ status: 403, description: 'Hanya akun artis yang dapat mengajukan banding' })
  create(@GetCurrentUser('sub') artistId: string, @Body() dto: CreateAppealDto) {
    return this.appealsService.create(artistId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Melihat seluruh daftar permohonan banding (Khusus Admin)' })
  @ApiQuery({
    name: 'status',
    enum: AppealStatus,
    required: false,
    description: 'Filter status banding (pending, approved, rejected)',
  })
  @ApiResponse({ status: 200, description: 'Daftar permohonan banding', type: [AppealResponseDto] })
  @ApiResponse({ status: 403, description: 'Hanya admin yang memiliki hak akses' })
  findAll(@Query('status') status?: AppealStatus) {
    return this.appealsService.findAll(status);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('artist')
  @ApiOperation({ summary: 'Melihat riwayat permohonan banding milik artis yang sedang login' })
  @ApiResponse({
    status: 200,
    description: 'Daftar permohonan banding artis',
    type: [AppealResponseDto],
  })
  findMy(@GetCurrentUser('sub') artistId: string) {
    return this.appealsService.findMy(artistId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'artist')
  @ApiOperation({ summary: 'Melihat detail pengajuan banding berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail pengajuan banding', type: AppealResponseDto })
  @ApiResponse({ status: 404, description: 'Pengajuan banding tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.appealsService.findOne(id);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary:
      'Menyetujui (Approve & Reset Strike) atau menolak (Reject) permohonan banding artist (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Permohonan banding berhasil diproses',
    type: AppealResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Banding sudah pernah diproses sebelumnya' })
  @ApiResponse({ status: 403, description: 'Hanya admin yang dapat memproses banding' })
  @ApiResponse({ status: 404, description: 'Pengajuan banding tidak ditemukan' })
  resolve(
    @Param('id') id: string,
    @GetCurrentUser('sub') adminId: string,
    @Body() dto: ResolveAppealDto,
  ) {
    return this.appealsService.resolve(id, adminId, dto);
  }
}
