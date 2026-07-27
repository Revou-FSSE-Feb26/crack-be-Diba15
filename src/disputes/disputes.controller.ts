import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import type { DisputeStatus } from '../generated/prisma/enums';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('disputes')
@UseGuards(JwtAccessGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * POST /api/disputes
   * Client atau Artis mengajukan sengketa komisi.
   */
  @Post()
  create(@GetCurrentUser('sub') reporterId: string, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(reporterId, dto);
  }

  /**
   * GET /api/disputes
   * Kurator & Admin melihat daftar sengketa komisi.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  findAll(@Query('status') status?: DisputeStatus) {
    return this.disputesService.findAll(status);
  }

  /**
   * GET /api/disputes/:id
   * Detail sengketa komisi.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @GetCurrentUser() requester: JwtPayload) {
    return this.disputesService.findOne(id, requester.sub, requester.role);
  }

  /**
   * PATCH /api/disputes/:id/resolve
   * Kurator/Mediator memutuskan sengketa (approved = refund ke client, rejected = release ke artis).
   */
  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('curator', 'admin')
  resolve(
    @Param('id') id: string,
    @GetCurrentUser('sub') mediatorId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, mediatorId, dto);
  }
}
