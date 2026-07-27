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
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { CreateUserDto } from './dto/create-user.dto';
import { TopUpDto } from './dto/topup.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAccessGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Balance & Wallet Operations (Self) ────────────────────────────────────

  /**
   * GET /api/users/balance
   * Lihat sisa saldo pengguna yang sedang login.
   */
  @Get('balance')
  getBalance(@GetCurrentUser('sub') userId: string) {
    return this.usersService.getBalance(userId);
  }

  /**
   * POST /api/users/topup
   * Top-up saldo pengguna yang sedang login.
   */
  @Post('topup')
  topUp(@GetCurrentUser('sub') userId: string, @Body() dto: TopUpDto) {
    return this.usersService.topUp(userId, dto);
  }

  // ─── Admin Only ──────────────────────────────────────────────────────────────

  /**
   * POST /api/users
   * Buat user baru secara manual (khusus admin, misal buat akun curator).
   */
  @Post()
  @Roles('admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * GET /api/users
   * List semua user (khusus admin).
   */
  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * DELETE /api/users/:id
   * Hapus user (khusus admin).
   */
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ─── Self or Admin ───────────────────────────────────────────────────────────

  /**
   * GET /api/users/:id
   * Lihat detail user. User bisa lihat profil diri sendiri, admin bisa lihat siapapun.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @GetCurrentUser() requester: JwtPayload) {
    const isSelf = requester.sub === id;
    const isAdmin = requester.role === 'admin';

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Kamu hanya bisa melihat profil sendiri.');
    }

    return this.usersService.findOne(id);
  }

  /**
   * PATCH /api/users/:id
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

    return this.usersService.update(id, updateUserDto);
  }
}
