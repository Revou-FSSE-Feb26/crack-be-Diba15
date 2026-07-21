import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SessionRepository } from './session.repository.js';

@Module({
  imports: [PrismaModule],
  providers: [SessionRepository],
  exports: [SessionRepository],
})
export class SessionModule {}
