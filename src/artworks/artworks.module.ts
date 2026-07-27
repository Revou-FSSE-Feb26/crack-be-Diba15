import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ArtworksController } from './artworks.controller';
import { ArtworksRepository } from './artworks.repository';
import { ArtworksService } from './artworks.service';

@Module({
  imports: [PrismaModule],
  controllers: [ArtworksController],
  providers: [ArtworksService, ArtworksRepository],
  exports: [ArtworksService, ArtworksRepository],
})
export class ArtworksModule {}
