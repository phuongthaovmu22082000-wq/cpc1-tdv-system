/**
 * n8n Integration — TASK 017
 * Spec Section 19 (N8N Automation Spec): WF01-WF06.
 *
 * Pattern: app gọi n8n webhook URL khi cần trigger workflow. n8n sẽ gọi
 * lại các API endpoints của app (inbound webhook) để lấy dữ liệu.
 * Biến môi trường: N8N_WEBHOOK_URL, N8N_API_KEY (Spec Section 27.2).
 */
import { env } from '@/lib/utils/env';

type WorkflowId = 'WF01' | 'WF02' | 'WF03' | 'WF04' | 'WF05' | 'WF06';

interface TriggerResult {
  ok: boolean;
  error?: string;
}

/**
 * Trigger một n8n workflow qua webhook.
 * Không throw — trả về { ok: false } nếu n8n chưa cấu hình hoặc lỗi mạng,
 * để app không bị crash khi n8n unavailable.
 */
export async function triggerN8nWorkflow(
  workflowId: WorkflowId,
  payload: Record<string, unknown> = {},
): Promise<TriggerResult> {
  if (!env.N8N_WEBHOOK_URL) {
    // n8n chưa được cấu hình (ví dụ local dev) — bỏ qua, không crash
    console.warn(`[n8n] N8N_WEBHOOK_URL not set, skipping ${workflowId}`);
    return { ok: true };
  }

  try {
    const url = `${env.N8N_WEBHOOK_URL}/${workflowId}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (env.N8N_API_KEY) {
      headers['X-N8N-Api-Key'] = env.N8N_API_KEY;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ workflowId, triggeredAt: new Date().toISOString(), ...payload }),
    });

    if (!resp.ok) {
      console.error(`[n8n] ${workflowId} trigger failed: HTTP ${resp.status}`);
      return { ok: false, error: `HTTP ${resp.status}` };
    }

    return { ok: true };
  } catch (err) {
    console.error(`[n8n] ${workflowId} trigger error:`, err);
    return { ok: false, error: String(err) };
  }
}

// ─── Typed helpers cho từng workflow ─────────────────────────────────────────

/** WF01 — Daily Report Reminder (trigger cuối ngày, cron ở n8n) */
export const triggerDailyReportReminder = () => triggerN8nWorkflow('WF01');

/** WF02 — Lost Sale Detection (trigger theo lịch, n8n pull data từ app) */
export const triggerLostSaleDetection = () => triggerN8nWorkflow('WF02');

/** WF03 — Tender Reminder */
export const triggerTenderReminder = (tenderId?: string) =>
  triggerN8nWorkflow('WF03', tenderId ? { tenderId } : {});

/** WF04 — KPI Calculation (trigger cuối tháng) */
export const triggerKpiCalculation = (period: { start: string; end: string }) =>
  triggerN8nWorkflow('WF04', { periodStart: period.start, periodEnd: period.end });

/** WF05 — Monthly KPI Report */
export const triggerMonthlyKpiReport = (period: { start: string; end: string }) =>
  triggerN8nWorkflow('WF05', { periodStart: period.start, periodEnd: period.end });

/** WF06 — Google Sheets Import */
export const triggerSheetsImport = (sheetId: string) => triggerN8nWorkflow('WF06', { sheetId });
