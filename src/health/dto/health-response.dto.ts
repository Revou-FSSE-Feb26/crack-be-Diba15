import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
    enum: ['ok', 'error'],
    description: 'Status kesehatan sistem',
  })
  status: string;

  @ApiProperty({
    example: '2026-09-07T04:16:00.000Z',
    description: 'Timestamp UTC server',
  })
  timestamp: string;

  @ApiProperty({
    example: 123.45,
    description: 'Uptime proses server Node.js dalam detik',
  })
  uptime: number;

  @ApiProperty({
    example: 'connected',
    enum: ['connected', 'disconnected'],
    description: 'Status koneksi ke database',
  })
  database: string;
}
