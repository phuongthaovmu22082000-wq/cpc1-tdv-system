import { withAuth, ok } from '@/lib/api/response';
import { markNotificationRead } from '@/lib/services/notification-service';

export const POST = withAuth(async (_req, { params }) => {
  await markNotificationRead(params?.id ?? '');
  return ok({ marked: true });
});
