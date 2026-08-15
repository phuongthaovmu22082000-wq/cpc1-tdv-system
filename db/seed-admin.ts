/**
 * Bootstrap tài khoản ADMIN đầu tiên — giải quyết bài toán "trứng-gà": hệ
 * thống cần ít nhất một tài khoản để đăng nhập lần đầu, nhưng employee là
 * business data không được hard-code (Spec Section 1.5).
 *
 * Giá trị lấy từ biến môi trường (KHÔNG hard-code trong code), Product
 * Owner tự cấu hình trước khi chạy lần đầu ở mỗi environment.
 *
 * Chạy: npm run db:seed:admin
 * Idempotent: nếu email đã tồn tại, chỉ log cảnh báo, không tạo trùng.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Xem .env.example.');
}

const ADMIN_EMPLOYEE_CODE = process.env.ADMIN_EMPLOYEE_CODE;
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMPLOYEE_CODE || !ADMIN_FULL_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    'Thiếu biến môi trường: ADMIN_EMPLOYEE_CODE, ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_PASSWORD. ' +
      'Xem .env.example.',
  );
}

if (ADMIN_PASSWORD.length < 8) {
  throw new Error('ADMIN_PASSWORD phải có ít nhất 8 ký tự.');
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  const [existing] = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.email, ADMIN_EMAIL!))
    .limit(1);

  if (existing) {
    console.log(`Employee với email ${ADMIN_EMAIL} đã tồn tại — bỏ qua.`);
    return;
  }

  const [adminRole] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.code, 'ADMIN'))
    .limit(1);

  if (!adminRole) {
    throw new Error('Role ADMIN chưa tồn tại — chạy `npm run db:seed` trước.');
  }

  const [employee] = await db
    .insert(schema.employees)
    .values({
      employeeCode: ADMIN_EMPLOYEE_CODE!,
      fullName: ADMIN_FULL_NAME!,
      email: ADMIN_EMAIL!,
      roleId: adminRole.id,
      status: 'ACTIVE',
    })
    .returning();

  const passwordHash = await hash(ADMIN_PASSWORD!, 12);
  await db.insert(schema.credentials).values({
    employeeId: employee.id,
    passwordHash,
  });

  console.log(`Đã tạo tài khoản ADMIN: ${ADMIN_EMAIL} (employee_code: ${ADMIN_EMPLOYEE_CODE})`);
}

main()
  .catch((err) => {
    console.error('Seed admin failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
