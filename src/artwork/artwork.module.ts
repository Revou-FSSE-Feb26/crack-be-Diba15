import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ArtworkController } from './artwork.controller.js';
import { ArtworkService } from './artwork.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ArtworkController],
  providers: [ArtworkService],
  exports: [ArtworkService],
})
export class ArtworkModule {}
