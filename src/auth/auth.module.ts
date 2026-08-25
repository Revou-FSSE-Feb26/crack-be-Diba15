import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SessionModule } from '../session/session.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { PasswordResetRepository } from './password-reset.repository';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    SessionModule,
    MailModule,
    // JwtModule tanpa secret global — setiap token di-sign manual di AuthService
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordResetRepository,
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
