/**
 * Environment variable handling for CPC1.
 *
 * Tất cả biến môi trường được validate ngay khi app khởi động.
 * Không được đọc `process.env.X` trực tiếp ở nơi khác trong codebase —
 * luôn import `env` từ file này để đảm bảo type-safety và fail-fast
 * khi thiếu cấu hình bắt buộc.
 *
 * Danh sách biến bám theo Spec Section 27.2 (Environment Variables).
 */
import { z } from 'zod';

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (TASK 002 sẽ dùng biến này để kết nối PostgreSQL)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(), // optional ở TASK 001 vì DB chưa được thiết lập; sẽ bắt buộc từ TASK 002.

  // Authentication (TASK 003)
  AUTH_SECRET: z.string().min(1).optional(),

  // Public app URL
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // n8n integration (TASK 017)
  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_API_KEY: z.string().min(1).optional(),

  // Email provider (notifications)
  EMAIL_PROVIDER_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment variables. Kiểm tra file .env / cấu hình Netlify:\n${formatted}`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
