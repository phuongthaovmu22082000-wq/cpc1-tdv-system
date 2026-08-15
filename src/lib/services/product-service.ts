/**
 * Product Service — TASK 008
 * Spec Section 8.9, 8.10.
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { products, productGroups } from '../../../db/schema';

export interface ProductListItem {
  id: string;
  productCode: string;
  productName: string;
  groupName: string;
  dosageForm: string;
  strength: string | null;
  unit: string;
  status: string;
}

export interface CreateProductInput {
  productCode: string;
  productName: string;
  productGroupId: string;
  dosageForm: string;
  strength?: string | null;
  unit: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listProducts(opts: { search?: string; status?: string } = {}) {
  const rows = await db
    .select({
      id: products.id,
      productCode: products.productCode,
      productName: products.productName,
      groupName: productGroups.name,
      dosageForm: products.dosageForm,
      strength: products.strength,
      unit: products.unit,
      status: products.status,
    })
    .from(products)
    .innerJoin(productGroups, eq(products.productGroupId, productGroups.id))
    .orderBy(products.productName);

  return rows.filter((r) => {
    if (opts.status && r.status !== opts.status) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      return r.productName.toLowerCase().includes(q) || r.productCode.toLowerCase().includes(q);
    }
    return true;
  });
}

export async function getProductById(id: string) {
  const [row] = await db
    .select({
      id: products.id,
      productCode: products.productCode,
      productName: products.productName,
      productGroupId: productGroups.id,
      groupName: productGroups.name,
      dosageForm: products.dosageForm,
      strength: products.strength,
      unit: products.unit,
      status: products.status,
    })
    .from(products)
    .innerJoin(productGroups, eq(products.productGroupId, productGroups.id))
    .where(eq(products.id, id))
    .limit(1);
  return row ?? null;
}

export async function listProductGroups() {
  return db.select().from(productGroups).orderBy(productGroups.name);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput) {
  const [product] = await db
    .insert(products)
    .values({ ...input })
    .returning();
  return product;
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const [updated] = await db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return updated;
}
