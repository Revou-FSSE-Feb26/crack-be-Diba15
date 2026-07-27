import { Module } from '@nestjs/common';
import { ArtworksModule } from './artworks/artworks.module';
import { AuthModule } from './auth/auth.module';
import { CommissionsModule } from './commissions/commissions.module';
import { DisputesModule } from './disputes/disputes.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReportsModule } from './reports/reports.module';
import { SessionModule } from './session/session.module';
import { SocialModule } from './social/social.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ArtworksModule,
    UploadModule,
    SessionModule,
    MailModule,
    SocialModule,
    ReportsModule,
    CommissionsModule,
    DisputesModule,
  ],
})
export class AppModule {}
