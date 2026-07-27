import { Module } from '@nestjs/common';
import { ArtworkModule } from './artwork/artwork.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ReportModule } from './report/report.module';
import { SessionModule } from './session/session.module';
import { SocialModule } from './social/social.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';

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
    ReportModule,
  ],
})
export class AppModule {}
