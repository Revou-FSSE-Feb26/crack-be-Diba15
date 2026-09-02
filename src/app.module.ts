import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppealsModule } from './appeals/appeals.module';
import { ArtworksModule } from './artworks/artworks.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { CommissionsModule } from './commissions/commissions.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MaintenanceCheckMiddleware } from './common/middleware/maintenance-check.middleware';
import { CuratorPerformanceModule } from './curator-performance/curator-performance.module';
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
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000,
        limit: 10,
      },
    ]),
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
    CuratorPerformanceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, MaintenanceCheckMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
