/**
 * Prescription Service — TASK 010
 * Spec Section 8.12, 8.13, 12.3.
 */
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  prescriptionReports,
  prescriptionItems,
  customers,
  products,
  employees,
} from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';
import { canAccessCustomer } from '@/lib/authorization';

export interface CreatePrescriptionInput {
  reportDate: string;
  customerId: string;
  doctorName?: string | null;
  note?: string | null;
  items: Array<{ productId: string; quantity: string; note?: string | null }>;
}

export async function listPrescriptions(currentEmployee: CurrentEmployee) {
  const rows = await db
    .select({
      id: prescriptionReports.id,
      reportDate: prescriptionReports.reportDate,
      employeeName: employees.fullName,
      customerName: customers.name,
      doctorName: prescriptionReports.doctorName,
      employeeId: prescriptionReports.employeeId,
    })
    .from(prescriptionReports)
    .innerJoin(employees, eq(prescriptionReports.employeeId, employees.id))
    .innerJoin(customers, eq(prescriptionReports.customerId, customers.id))
    .orderBy(desc(prescriptionReports.reportDate));

  return rows.filter((r) => {
    if (!['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode)) {
      return r.employeeId === currentEmployee.id;
    }
    return true;
  });
}

export async function createPrescription(
  currentEmployee: CurrentEmployee,
  input: CreatePrescriptionInput,
) {
  // Spec 12.3: TDV chỉ nhập kê đơn cho customer trong scope
  const allowed = await canAccessCustomer(currentEmployee, input.customerId);
  if (!allowed) throw new Error('Bạn không có quyền kê đơn cho khách hàng này.');

  const [custRow] = await db
    .select({ territoryId: customers.territoryId })
    .from(customers)
    .where(eq(customers.id, input.customerId))
    .limit(1);

  if (!custRow) throw new Error('Khách hàng không tồn tại.');

  const [report] = await db
    .insert(prescriptionReports)
    .values({
      reportDate: input.reportDate,
      employeeId: currentEmployee.id,
      territoryId: custRow.territoryId,
      customerId: input.customerId,
      doctorName: input.doctorName ?? null,
      note: input.note ?? null,
    })
    .returning();

  if (input.items.length > 0) {
    await db.insert(prescriptionItems).values(
      input.items.map((item) => ({
        prescriptionReportId: report.id,
        productId: item.productId,
        quantity: item.quantity,
        note: item.note ?? null,
      })),
    );
  }

  return report;
}
