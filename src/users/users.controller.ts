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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt-access.strategy';
import { CreateUserDto } from './dto/create-user.dto';
import { TopUpDto } from './dto/topup.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Melihat sisa saldo dompet pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Saldo pengguna' })
  getBalance(@GetCurrentUser('sub') userId: string) {
    return this.usersService.getBalance(userId);
  }

  /**
   * POST /api/users/topup
   * Top-up saldo pengguna yang sedang login.
   */
  @Post('topup')
  @ApiOperation({ summary: 'Top-up saldo dompet pengguna' })
  @ApiResponse({ status: 200, description: 'Saldo berhasil ditambahkan' })
  topUp(@GetCurrentUser('sub') userId: string, @Body() dto: TopUpDto) {
    return this.usersService.topUp(userId, dto);
  }

  /**
   * POST /api/users/withdraw
   * Tarik saldo / pencairan dana (khusus artist, min Rp 100.000).
   */
  @Post('withdraw')
  @Roles('artist')
  @ApiOperation({ summary: 'Pencairan saldo ke rekening/e-wallet (Khusus Artist, min Rp 100.000)' })
  @ApiResponse({ status: 200, description: 'Pencairan dana berhasil diproses' })
  @ApiResponse({ status: 400, description: 'Saldo tidak mencukupi / kurang dari minimal' })
  withdraw(@GetCurrentUser('sub') userId: string, @Body() dto: WithdrawDto) {
    return this.usersService.withdraw(userId, dto);
  }

  // ─── Admin Only ──────────────────────────────────────────────────────────────

  /**
   * POST /api/users
   * Buat user baru secara manual (khusus admin, misal buat akun curator).
   */
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Membuat user baru (Admin Only)' })
  @ApiResponse({ status: 201, description: 'User berhasil dibuat' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin only' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * GET /api/users
   * List semua user (khusus admin).
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh user untuk admin dashboard' })
  @ApiResponse({ status: 200, description: 'Daftar user' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin only' })
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * DELETE /api/users/:id
   * Hapus user (khusus admin).
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Menghapus user (Admin Only)' })
  @ApiResponse({ status: 200, description: 'User berhasil dihapus' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin only' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ─── Self or Admin ───────────────────────────────────────────────────────────

  /**
   * GET /api/users/:id
   * Lihat detail user. User bisa lihat profil diri sendiri, admin bisa lihat siapapun.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Melihat detail user (Diri sendiri atau Admin)' })
  @ApiResponse({ status: 200, description: 'Detail user' })
  @ApiResponse({ status: 403, description: 'Forbidden: Hanya boleh melihat profil sendiri' })
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
  @ApiOperation({ summary: 'Memperbarui profil user' })
  @ApiResponse({ status: 200, description: 'Profil user diperbarui' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
