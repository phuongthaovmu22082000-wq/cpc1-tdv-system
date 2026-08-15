/**
 * Notification Service — TASK 016
 * Spec Section 8.20. Insert-only, đánh dấu đã đọc qua readAt.
 */
import { eq, isNull, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { notifications } from '../../../db/schema';

export async function getUnreadNotifications(employeeId: string) {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.employeeId, employeeId), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getAllNotifications(employeeId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.employeeId, employeeId))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
}

export async function createNotification(input: {
  employeeId: string;
  type: string;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
}) {
  const [row] = await db.insert(notifications).values(input).returning();
  return row;
}

export async function markNotificationRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllRead(employeeId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.employeeId, employeeId), isNull(notifications.readAt)));
}
