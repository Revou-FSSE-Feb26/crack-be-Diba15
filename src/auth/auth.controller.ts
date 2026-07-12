import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthService } from './auth.service';
import { GetCurrentUser } from './decorators/get-current-user.decorator';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { JwtPayload } from './strategies/jwt-access.strategy';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari dalam ms
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }

  // POST /api/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }

  // POST /api/auth/refresh
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetCurrentUser() user: JwtPayload & { refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      user.sub,
      user.refreshToken,
    );
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }

  // POST /api/auth/logout
  @Post('logout')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@GetCurrentUser('sub') userId: string, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(userId);
    res.clearCookie('refresh_token');
    return { message: 'Berhasil logout.' };
  }

  // GET /api/auth/me
  @Get('me')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@GetCurrentUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }
}
