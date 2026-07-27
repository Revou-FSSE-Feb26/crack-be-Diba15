import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommissionsController } from './commissions.controller';
import { CommissionsRepository } from './commissions.repository';
import { CommissionsService } from './commissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommissionsController],
  providers: [CommissionsService, CommissionsRepository],
  exports: [CommissionsService, CommissionsRepository],
})
export class CommissionsModule {}
