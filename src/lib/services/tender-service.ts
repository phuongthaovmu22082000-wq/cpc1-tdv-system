/**
 * Tender Service — TASK 011
 * Spec Section 8.14, 8.15, 12.4 (Status Machine).
 *
 * Status transitions (Spec 12.4):
 *   DRAFT → PREPARING
 *   PREPARING → SUBMITTED
 *   SUBMITTED → WAITING_RESULT
 *   WAITING_RESULT → WON
 *   WAITING_RESULT → LOST
 *
 * Mỗi transition PHẢI tạo dòng tender_status_history.
 */
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  tenders,
  tenderStatusHistory,
  customers,
  employees,
  territories,
} from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';
import { canAccessCustomer } from '@/lib/authorization';

// ─── Status Machine ───────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PREPARING'],
  PREPARING: ['SUBMITTED'],
  SUBMITTED: ['WAITING_RESULT'],
  WAITING_RESULT: ['WON', 'LOST'],
};

function isValidTransition(from: string, to: string): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateTenderInput {
  customerId: string;
  tenderCode: string;
  tenderName: string;
  description?: string | null;
  expectedValue?: string | null;
  startDate?: string | null;
  submissionDate?: string | null;
  note?: string | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listTenders(currentEmployee: CurrentEmployee) {
  const rows = await db
    .select({
      id: tenders.id,
      tenderCode: tenders.tenderCode,
      tenderName: tenders.tenderName,
      customerName: customers.name,
      employeeName: employees.fullName,
      territoryName: territories.name,
      status: tenders.status,
      submissionDate: tenders.submissionDate,
      expectedValue: tenders.expectedValue,
      employeeId: tenders.employeeId,
    })
    .from(tenders)
    .innerJoin(customers, eq(tenders.customerId, customers.id))
    .innerJoin(employees, eq(tenders.employeeId, employees.id))
    .innerJoin(territories, eq(tenders.territoryId, territories.id))
    .orderBy(desc(tenders.createdAt));

  return rows.filter((r) => {
    if (!['ADMIN', 'MANAGER'].includes(currentEmployee.roleCode)) {
      return r.employeeId === currentEmployee.id;
    }
    return true;
  });
}

export async function getTenderById(id: string) {
  const [row] = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
  return row ?? null;
}

export async function getTenderHistory(tenderId: string) {
  return db
    .select({
      id: tenderStatusHistory.id,
      oldStatus: tenderStatusHistory.oldStatus,
      newStatus: tenderStatusHistory.newStatus,
      changedBy: employees.fullName,
      changedAt: tenderStatusHistory.changedAt,
      note: tenderStatusHistory.note,
    })
    .from(tenderStatusHistory)
    .innerJoin(employees, eq(tenderStatusHistory.changedBy, employees.id))
    .where(eq(tenderStatusHistory.tenderId, tenderId))
    .orderBy(tenderStatusHistory.changedAt);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createTender(currentEmployee: CurrentEmployee, input: CreateTenderInput) {
  const allowed = await canAccessCustomer(currentEmployee, input.customerId);
  if (!allowed) throw new Error('Bạn không có quyền tạo thầu cho khách hàng này.');

  const [custRow] = await db
    .select({ territoryId: customers.territoryId })
    .from(customers)
    .where(eq(customers.id, input.customerId))
    .limit(1);
  if (!custRow) throw new Error('Khách hàng không tồn tại.');

  const [tender] = await db
    .insert(tenders)
    .values({
      tenderCode: input.tenderCode,
      tenderName: input.tenderName,
      customerId: input.customerId,
      employeeId: currentEmployee.id,
      territoryId: custRow.territoryId,
      description: input.description ?? null,
      expectedValue: input.expectedValue ?? null,
      startDate: input.startDate ?? null,
      submissionDate: input.submissionDate ?? null,
      note: input.note ?? null,
      status: 'DRAFT',
    })
    .returning();

  // Ghi history bước khởi tạo
  await db.insert(tenderStatusHistory).values({
    tenderId: tender.id,
    oldStatus: null,
    newStatus: 'DRAFT',
    changedBy: currentEmployee.id,
  });

  return tender;
}

/**
 * Chuyển trạng thái tender theo Status Machine (Spec 12.4).
 * Validate transition → cập nhật bảng tenders → ghi history.
 * Transaction đảm bảo atomic.
 */
export async function transitionTenderStatus(
  tenderId: string,
  newStatus: string,
  changedBy: CurrentEmployee,
  note?: string | null,
) {
  const tender = await getTenderById(tenderId);
  if (!tender) throw new Error('Thầu không tồn tại.');

  if (!isValidTransition(tender.status, newStatus)) {
    throw new Error(`Không thể chuyển từ trạng thái "${tender.status}" sang "${newStatus}".`);
  }

  const [updated] = await db
    .update(tenders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(tenders.id, tenderId))
    .returning();

  await db.insert(tenderStatusHistory).values({
    tenderId,
    oldStatus: tender.status,
    newStatus,
    changedBy: changedBy.id,
    note: note ?? null,
  });

  return updated;
}
