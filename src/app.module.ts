import { Module } from '@nestjs/common';
import { ArtworkModule } from './artwork/artwork.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MailModule } from './mail/mail.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { SessionModule } from './session/session.module.js';
import { SocialModule } from './social/social.module.js';
import { UploadModule } from './upload/upload.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ProfileModule,
    ArtworkModule,
    UploadModule,
    SessionModule,
    MailModule,
    SocialModule,
  ],
})
export class AppModule {}
