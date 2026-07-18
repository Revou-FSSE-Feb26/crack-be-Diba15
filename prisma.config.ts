import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // CLI/Migrate: pakai direct connection (port 5432) agar tidak stuck di pooler Supavisor
    url: env('DIRECT_URL'),
  },
});
