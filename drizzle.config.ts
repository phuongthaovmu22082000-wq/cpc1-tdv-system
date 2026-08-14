import { defineConfig } from 'drizzle-kit';

// drizzle-kit đọc DATABASE_URL trực tiếp từ process.env (không qua Zod env
// validation của app) vì đây là CLI chạy độc lập, không phải Next.js runtime.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run drizzle-kit. Xem .env.example.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
