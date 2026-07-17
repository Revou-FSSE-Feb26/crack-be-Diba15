import { Module } from '@nestjs/common';
import { ArtworkModule } from './artwork/artwork.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { UploadModule } from './upload/upload.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ProfileModule, ArtworkModule, UploadModule],
})
export class AppModule {}
