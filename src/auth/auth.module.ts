import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module.js';
import { SessionModule } from '../session/session.module.js';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';

@Module({
  imports: [
    PassportModule,
    UserModule,
    SessionModule,
    MailModule,
    // JwtModule tanpa secret global — setiap token di-sign manual di AuthService
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetRepository, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
