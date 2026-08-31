import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AppealsController } from './appeals.controller';
import { AppealsRepository } from './appeals.repository';
import { AppealsService } from './appeals.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppealsController],
  providers: [
    AppealsService,
    {
      provide: 'IAppealsRepository',
      useClass: AppealsRepository,
    },
  ],
  exports: [AppealsService, 'IAppealsRepository'],
})
export class AppealsModule {}
