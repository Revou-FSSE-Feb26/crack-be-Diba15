import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UserModule],
})
export class AppModule {}
