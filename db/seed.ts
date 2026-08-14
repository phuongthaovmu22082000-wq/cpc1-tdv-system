/**
 * Seed dữ liệu hệ thống (KHÔNG phải business data như employee/customer
 * thật — Spec Section 1.5 cấm hard-code business data, nhưng seed các
 * bảng "định nghĩa hệ thống" như roles/permissions/customer_types là hợp
 * lệ vì đây chính là configuration, không phải dữ liệu nghiệp vụ).
 *
 * Chạy: npm run db:seed
 * Idempotent: có thể chạy lại nhiều lần an toàn (dùng onConflictDoNothing).
 */
import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';

// Next.js tự load .env.local ở runtime thật, nhưng seed script chạy độc
// lập qua tsx nên cần load thủ công.
loadEnv({ path: '.env.local' });
loadEnv(); // fallback .env nếu có (ví dụ CI/CD dùng .env)
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed. Xem .env.example.');
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

// Spec Section 8.1
const ROLES = [
  { code: 'TDV', name: 'Trình dược viên' },
  { code: 'SUPERVISOR', name: 'Giám sát' },
  { code: 'MANAGER', name: 'Quản lý' },
  { code: 'ADMIN', name: 'Quản trị hệ thống' },
] as const;

// Spec Section 8.2 — Minimum permissions
const PERMISSIONS = [
  'DASHBOARD_VIEW',
  'CUSTOMER_VIEW',
  'CUSTOMER_CREATE',
  'CUSTOMER_UPDATE',
  'CUSTOMER_ASSIGN',
  'PRODUCT_VIEW',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'SALES_VIEW',
  'SALES_CREATE',
  'SALES_UPDATE',
  'PRESCRIPTION_VIEW',
  'PRESCRIPTION_CREATE',
  'PRESCRIPTION_UPDATE',
  'TENDER_VIEW',
  'TENDER_CREATE',
  'TENDER_UPDATE',
  'TENDER_STATUS_UPDATE',
  'KPI_VIEW',
  'KPI_MANAGE',
  'DAILY_REPORT_VIEW',
  'DAILY_REPORT_CREATE',
  'DAILY_REPORT_UPDATE',
  'EMPLOYEE_VIEW',
  'EMPLOYEE_MANAGE',
  'TERRITORY_VIEW',
  'TERRITORY_MANAGE',
  'NOTIFICATION_VIEW',
  'AUDIT_VIEW',
  'SYSTEM_ADMIN',
] as const;

// Spec Section 8.6
const CUSTOMER_TYPES = [
  { code: 'HOSPITAL', name: 'Bệnh viện' },
  { code: 'HEALTH_DEPARTMENT', name: 'Sở Y tế' },
  { code: 'PRIVATE_CLINIC', name: 'Phòng mạch tư nhân' },
] as const;

// Spec Section 2.2 — Địa bàn ban đầu
const TERRITORIES = [
  { code: 'DN', name: 'Đà Nẵng', province: 'Đà Nẵng' },
  { code: 'QNA', name: 'Quảng Nam', province: 'Quảng Nam' },
  { code: 'QNG', name: 'Quảng Ngãi', province: 'Quảng Ngãi' },
  { code: 'BD', name: 'Bình Định', province: 'Bình Định' },
  { code: 'GL', name: 'Gia Lai', province: 'Gia Lai' },
] as const;

/**
 * Mapping role → permission mặc định.
 * Đây là điểm khởi đầu hợp lý theo Access Matrix (Build Plan Section 3.3),
 * Product Owner có thể chỉnh lại qua UI Permission Management (TASK 018)
 * sau khi hệ thống chạy — KHÔNG hard-code lại giá trị này ở nơi khác.
 */
const ROLE_PERMISSION_MAP: Record<(typeof ROLES)[number]['code'], readonly string[]> = {
  TDV: [
    'DASHBOARD_VIEW',
    'CUSTOMER_VIEW',
    'PRODUCT_VIEW',
    'SALES_VIEW',
    'SALES_CREATE',
    'PRESCRIPTION_VIEW',
    'PRESCRIPTION_CREATE',
    'TENDER_VIEW',
    'KPI_VIEW',
    'DAILY_REPORT_VIEW',
    'DAILY_REPORT_CREATE',
    'DAILY_REPORT_UPDATE',
    'NOTIFICATION_VIEW',
  ],
  SUPERVISOR: [
    'DASHBOARD_VIEW',
    'CUSTOMER_VIEW',
    'CUSTOMER_ASSIGN',
    'PRODUCT_VIEW',
    'SALES_VIEW',
    'SALES_CREATE',
    'SALES_UPDATE',
    'PRESCRIPTION_VIEW',
    'PRESCRIPTION_CREATE',
    'PRESCRIPTION_UPDATE',
    'TENDER_VIEW',
    'TENDER_CREATE',
    'TENDER_UPDATE',
    'KPI_VIEW',
    'DAILY_REPORT_VIEW',
    'DAILY_REPORT_CREATE',
    'DAILY_REPORT_UPDATE',
    'EMPLOYEE_VIEW',
    'TERRITORY_VIEW',
    'NOTIFICATION_VIEW',
    'AUDIT_VIEW',
  ],
  MANAGER: [
    'DASHBOARD_VIEW',
    'CUSTOMER_VIEW',
    'CUSTOMER_CREATE',
    'CUSTOMER_UPDATE',
    'CUSTOMER_ASSIGN',
    'PRODUCT_VIEW',
    'PRODUCT_CREATE',
    'PRODUCT_UPDATE',
    'SALES_VIEW',
    'SALES_CREATE',
    'SALES_UPDATE',
    'PRESCRIPTION_VIEW',
    'PRESCRIPTION_CREATE',
    'PRESCRIPTION_UPDATE',
    'TENDER_VIEW',
    'TENDER_CREATE',
    'TENDER_UPDATE',
    'TENDER_STATUS_UPDATE',
    'KPI_VIEW',
    'KPI_MANAGE',
    'DAILY_REPORT_VIEW',
    'DAILY_REPORT_CREATE',
    'DAILY_REPORT_UPDATE',
    'EMPLOYEE_VIEW',
    'EMPLOYEE_MANAGE',
    'TERRITORY_VIEW',
    'TERRITORY_MANAGE',
    'NOTIFICATION_VIEW',
    'AUDIT_VIEW',
  ],
  ADMIN: [...PERMISSIONS], // Full access
};

async function seed() {
  console.log('Seeding roles...');
  const insertedRoles = await db
    .insert(schema.roles)
    .values(ROLES.map((r) => ({ code: r.code, name: r.name, isActive: true })))
    .onConflictDoNothing({ target: schema.roles.code })
    .returning();

  const allRoles =
    insertedRoles.length === ROLES.length ? insertedRoles : await db.query.roles.findMany();

  console.log('Seeding permissions...');
  const insertedPermissions = await db
    .insert(schema.permissions)
    .values(PERMISSIONS.map((code) => ({ code, name: code })))
    .onConflictDoNothing({ target: schema.permissions.code })
    .returning();

  const allPermissions =
    insertedPermissions.length === PERMISSIONS.length
      ? insertedPermissions
      : await db.query.permissions.findMany();

  console.log('Seeding role_permissions...');
  const roleByCode = new Map(allRoles.map((r) => [r.code, r]));
  const permissionByCode = new Map(allPermissions.map((p) => [p.code, p]));

  const rolePermissionRows = Object.entries(ROLE_PERMISSION_MAP).flatMap(
    ([roleCode, permissionCodes]) => {
      const role = roleByCode.get(roleCode);
      if (!role) return [];
      return permissionCodes
        .map((code) => permissionByCode.get(code))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((permission) => ({ roleId: role.id, permissionId: permission.id }));
    },
  );

  if (rolePermissionRows.length > 0) {
    await db.insert(schema.rolePermissions).values(rolePermissionRows).onConflictDoNothing();
  }

  console.log('Seeding customer_types...');
  await db
    .insert(schema.customerTypes)
    .values(CUSTOMER_TYPES.map((c) => ({ ...c })))
    .onConflictDoNothing({ target: schema.customerTypes.code });

  console.log('Seeding territories...');
  await db
    .insert(schema.territories)
    .values(TERRITORIES.map((t) => ({ ...t, status: 'ACTIVE' })))
    .onConflictDoNothing({ target: schema.territories.code });

  console.log('Seed completed.');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
