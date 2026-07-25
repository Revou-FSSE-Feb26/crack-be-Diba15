import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ArtworkController } from './artwork.controller';
import { ArtworkRepository } from './artwork.repository';
import { ArtworkService } from './artwork.service';

@Module({
  imports: [PrismaModule],
  controllers: [ArtworkController],
  providers: [ArtworkService, ArtworkRepository],
  exports: [ArtworkService, ArtworkRepository],
})
export class ArtworkModule {}
