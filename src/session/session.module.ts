import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionRepository } from './session.repository';

@Module({
  imports: [PrismaModule],
  providers: [SessionRepository],
  exports: [SessionRepository],
})
export class SessionModule {}
