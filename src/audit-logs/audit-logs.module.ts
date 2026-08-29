import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [
    AuditLogsService,
    {
      provide: 'IAuditLogsRepository',
      useClass: AuditLogsRepository,
    },
  ],
  exports: [AuditLogsService, 'IAuditLogsRepository'],
})
export class AuditLogsModule {}
