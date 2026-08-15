/**
 * Customer Service — TASK 007
 * Spec Section 8.7, 12.1, Authorization Section 11.
 */
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { customers, customerTypes, territories, employeeCustomers } from '../../../db/schema';
import type { CurrentEmployee } from '@/lib/auth/current-user';
import { getAllowedCustomerIds, canAccessCustomer } from '@/lib/authorization';

export interface CustomerListItem {
  id: string;
  customerCode: string;
  name: string;
  customerTypeName: string;
  territoryCode: string;
  territoryName: string;
  province: string | null;
  status: string;
}

export interface CreateCustomerInput {
  customerCode: string;
  customerTypeId: string;
  name: string;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  territoryId: string;
  contactName?: string | null;
  contactPhone?: string | null;
}

export interface AssignCustomerInput {
  employeeId: string;
  customerId: string;
  startDate: string;
  isPrimary?: boolean;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listCustomers(
  currentEmployee: CurrentEmployee,
  opts: { search?: string; territoryId?: string; status?: string } = {},
): Promise<CustomerListItem[]> {
  const allowedIds = await getAllowedCustomerIds(currentEmployee);

  const rows = await db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
      customerTypeName: customerTypes.name,
      territoryCode: territories.code,
      territoryName: territories.name,
      province: customers.province,
      status: customers.status,
    })
    .from(customers)
    .innerJoin(customerTypes, eq(customers.customerTypeId, customerTypes.id))
    .innerJoin(territories, eq(customers.territoryId, territories.id))
    .orderBy(customers.name);

  return rows.filter((r) => {
    if (allowedIds !== null && !allowedIds.includes(r.id)) return false;
    if (opts.status && r.status !== opts.status) return false;
    if (opts.territoryId && r.territoryCode !== opts.territoryId) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.customerCode.toLowerCase().includes(q);
    }
    return true;
  });
}

export async function getCustomerById(id: string) {
  const [row] = await db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
      address: customers.address,
      province: customers.province,
      district: customers.district,
      contactName: customers.contactName,
      contactPhone: customers.contactPhone,
      status: customers.status,
      customerTypeId: customerTypes.id,
      customerTypeName: customerTypes.name,
      territoryId: territories.id,
      territoryCode: territories.code,
      territoryName: territories.name,
    })
    .from(customers)
    .innerJoin(customerTypes, eq(customers.customerTypeId, customerTypes.id))
    .innerJoin(territories, eq(customers.territoryId, territories.id))
    .where(eq(customers.id, id))
    .limit(1);
  return row ?? null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createCustomer(input: CreateCustomerInput) {
  const [customer] = await db
    .insert(customers)
    .values({ ...input })
    .returning();
  return customer;
}

export async function updateCustomer(id: string, input: Partial<CreateCustomerInput>) {
  const [updated] = await db
    .update(customers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return updated;
}

export async function assignCustomerToEmployee(input: AssignCustomerInput) {
  // Kết thúc assignment hiện tại nếu có
  if (input.isPrimary) {
    await db
      .update(employeeCustomers)
      .set({ endDate: input.startDate })
      .where(
        and(
          eq(employeeCustomers.customerId, input.customerId),
          eq(employeeCustomers.isPrimary, true),
          isNull(employeeCustomers.endDate),
        ),
      );
  }

  const [row] = await db
    .insert(employeeCustomers)
    .values({
      employeeId: input.employeeId,
      customerId: input.customerId,
      startDate: input.startDate,
      isPrimary: input.isPrimary ?? false,
    })
    .returning();
  return row;
}
