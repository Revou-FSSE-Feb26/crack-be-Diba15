import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Runtime: pakai pooler Supavisor (port 6543) untuk NestJS
    url: env('DATABASE_URL'),
    // Migrate: pakai direct connection (port 5432) agar prisma migrate tidak stuck
    // directUrl: env('DIRECT_URL'),
  },
});
