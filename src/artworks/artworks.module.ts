import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ArtistsRepository } from './artists.repository';
import { ArtworksController } from './artworks.controller';
import { ArtworksRepository } from './artworks.repository';
import { ArtworksService } from './artworks.service';
import { TagsRepository } from './tags.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ArtworksController],
  providers: [ArtworksService, ArtworksRepository, TagsRepository, ArtistsRepository],
  exports: [ArtworksService, ArtworksRepository, TagsRepository, ArtistsRepository],
})
export class ArtworksModule {}
