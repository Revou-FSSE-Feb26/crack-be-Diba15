import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserService } from './user.service.js';

@Controller('user')
@UseGuards(JwtAccessGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ─── Admin Only ──────────────────────────────────────────────────────────────

  /**
   * POST /api/user
   * Buat user baru secara manual (khusus admin, misal buat akun curator).
   */
  @Post()
  @Roles('admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * GET /api/user
   * List semua user (khusus admin).
   */
  @Get()
  @Roles('admin')
  findAll() {
    return this.userService.findAll();
  }

  /**
   * DELETE /api/user/:id
   * Hapus user (khusus admin).
   */
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // ─── Self or Admin ───────────────────────────────────────────────────────────

  /**
   * GET /api/user/:id
   * Lihat detail user. User bisa lihat profil diri sendiri, admin bisa lihat siapapun.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetCurrentUser() requester: JwtPayload,
  ) {
    const isSelf = requester.sub === id;
    const isAdmin = requester.role === 'admin';

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Kamu hanya bisa melihat profil sendiri.');
    }

    return this.userService.findOne(id);
  }

  /**
   * PATCH /api/user/:id
   * Update data user. User hanya bisa update dirinya sendiri.
   * Admin bisa update siapapun (termasuk mengubah role dan balance).
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetCurrentUser() requester: JwtPayload,
  ) {
    const isSelf = requester.sub === id;
    const isAdmin = requester.role === 'admin';

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Kamu hanya bisa mengubah data diri sendiri.');
    }

    // User biasa tidak boleh mengubah role atau balance secara langsung
    if (!isAdmin) {
      delete updateUserDto.role;
      delete updateUserDto.balance;
    }

    return this.userService.update(id, updateUserDto);
  }
}
