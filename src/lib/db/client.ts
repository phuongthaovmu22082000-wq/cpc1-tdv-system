import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/utils/env';
import * as schema from '../../../db/schema';

/**
 * DB client dùng chung toàn app. Import `db` từ đây — KHÔNG tự tạo
 * connection khác ở nơi khác trong codebase, để tránh rò rỉ connection pool
 * (đặc biệt quan trọng trên Netlify serverless functions).
 */

declare global {
  var __cpc1_pg_client: ReturnType<typeof postgres> | undefined;
}

function getClient() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL chưa được cấu hình. Xem .env.example và Spec Section 27.2.');
  }

  // Tái sử dụng connection giữa các lần hot-reload ở dev / giữa các
  // invocation "ấm" trên serverless, tránh mở quá nhiều connection.
  if (!global.__cpc1_pg_client) {
    global.__cpc1_pg_client = postgres(env.DATABASE_URL, {
      max: env.NODE_ENV === 'production' ? 5 : 10,
    });
  }

  return global.__cpc1_pg_client;
}

export const db = drizzle(getClient(), { schema });

export type Database = typeof db;
