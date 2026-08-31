import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /api/transactions/my
   * Mengambil riwayat mutasi transaksi dompet pengguna yang sedang login.
   */
  @Get('my')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({
    summary: 'Riwayat Transaksi Saya',
    description:
      'Mengambil riwayat mutasi dompet pengguna yang sedang login (Topup, Withdraw, Pembayaran, Payout).',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar riwayat transaksi pengguna berhasil dimuat.',
  })
  getMyTransactions(@GetCurrentUser('sub') userId: string) {
    return this.transactionsService.getMyTransactions(userId);
  }

  /**
   * GET /api/transactions/summary
   * Mengambil ringkasan metrik finansial platform (Admin only).
   */
  @Get('summary')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Ringkasan Laporan Finansial Platform (Admin Only)',
    description:
      'Mengambil agregasi metrik GMV transaksi, dana tertahan di Escrow, fee platform 5%, dan total pencairan dana.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ringkasan finansial platform berhasil dikalkulasi.',
  })
  getFinancialSummary() {
    return this.transactionsService.getFinancialSummary();
  }

  /**
   * GET /api/transactions
   * Mengambil seluruh buku kas transaksi platform dengan filter & pagination (Admin only).
   */
  @Get()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Daftar Semua Transaksi Platform (Admin Only)',
    description:
      'Mengambil seluruh log mutasi transaksi platform dengan filter rentang tanggal, tipe transaksi, dan pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaksi platform berhasil dimuat.',
  })
  getAllTransactions(@Query() dto: FilterTransactionDto) {
    return this.transactionsService.getAllTransactions(dto);
  }

  /**
   * GET /api/transactions/:id
   * Mengambil rincian detail 1 transaksi.
   */
  @Get(':id')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({
    summary: 'Detail Transaksi',
    description: 'Mengambil detail data transaksi berdasarkan ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail transaksi berhasil dimuat.',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaksi tidak ditemukan.',
  })
  getTransactionById(@Param('id') id: string) {
    return this.transactionsService.getTransactionById(id);
  }
}
