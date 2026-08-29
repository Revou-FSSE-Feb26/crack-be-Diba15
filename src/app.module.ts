import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { AppealsModule } from './appeals/appeals.module';
import { ArtworksModule } from './artworks/artworks.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { CommissionsModule } from './commissions/commissions.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MaintenanceCheckMiddleware } from './common/middleware/maintenance-check.middleware';
import { DisputesModule } from './disputes/disputes.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ReportsModule } from './reports/reports.module';
import { SessionModule } from './session/session.module';
import { SocialModule } from './social/social.module';
import { TransactionsModule } from './transactions/transactions.module';
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
    TransactionsModule,
    AppealsModule,
    AuditLogsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, MaintenanceCheckMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
