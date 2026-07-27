import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DisputesController } from './disputes.controller';
import { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';

@Module({
  imports: [PrismaModule],
  controllers: [DisputesController],
  providers: [DisputesService, DisputesRepository],
  exports: [DisputesService, DisputesRepository],
})
export class DisputesModule {}
