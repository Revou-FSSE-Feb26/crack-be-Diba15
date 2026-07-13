import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './jwt-access.strategy.js';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      // Ambil refresh token dari HttpOnly Cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? '',
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    // Inject raw token ke request agar bisa diverifikasi dengan hash di DB
    const refreshToken = req.cookies?.refresh_token as string;
    return { ...payload, refreshToken };
  }
}
