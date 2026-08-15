import { withAuth, ok } from '@/lib/api/response';
import { getAllNotifications, markAllRead } from '@/lib/services/notification-service';

export const GET = withAuth(async (_req, { employee }) => {
  const data = await getAllNotifications(employee.id);
  return ok(data);
});

export const POST = withAuth(async (_req, { employee }) => {
  await markAllRead(employee.id);
  return ok({ marked: true });
});
