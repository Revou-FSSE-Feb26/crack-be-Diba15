import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ArtworkController } from './artwork.controller.js';
import { ArtworkRepository } from './artwork.repository.js';
import { ArtworkService } from './artwork.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ArtworkController],
  providers: [ArtworkService, ArtworkRepository],
  exports: [ArtworkService, ArtworkRepository],
})
export class ArtworkModule {}
