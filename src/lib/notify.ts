import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.ALERTS_FROM || "Contract Alerts <alerts@example.com>";

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

/** simple HTML→text fallback */
function htmlToText(html: string) {
  try {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Sends an email. If RESEND_API_KEY is missing, logs a SIMULATED email.
 * - De-dupes recipients
 * - Batches large lists (default 50 per call)
 * - Adds a text fallback body
 */
export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  batchSize?: number;       // optional override
  interBatchDelayMs?: number; // optional override
}) {
  const batchSize = Math.max(1, opts.batchSize ?? 50);
  const interBatchDelayMs = Math.max(0, opts.interBatchDelayMs ?? 400); // ~2.5 rps cap across batches

  // normalize recipients
  const to = Array.from(new Set((opts.to || []).map((s) => s.trim()).filter(Boolean)));
  const subject = opts.subject;
  const html = opts.html;
  const text = htmlToText(html) || undefined;
  const replyTo = opts.replyTo;

  if (!to.length) return;

  // Fallback to console logging if no key or in test-like env
  if (!resend) {
    console.log("[EMAIL:SIMULATED]", {
      to,
      subject,
      preview: html.slice(0, 160) + (html.length > 160 ? "...(truncated)" : ""),
    });
    return;
  }

  const batches = chunk(to, batchSize);
  let lastError: any = null;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const result = await resend.emails.send({
      from: FROM,
      to: batch,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if ((result as any)?.error) {
      lastError = new Error((result as any).error.message || "Email send failed");
      break;
    }

    // tiny delay between batches to respect provider limits
    if (i < batches.length - 1) await sleep(interBatchDelayMs);
  }

  if (lastError) throw lastError;
}

/** Retry wrapper for sendEmail with exponential backoff on 429/rate-limits. */
export async function sendEmailWithRetry(
  opts: { to: string[]; subject: string; html: string; replyTo?: string; batchSize?: number; interBatchDelayMs?: number },
  maxAttempts: number = 5
) {
  let attempt = 1;
  while (true) {
    try {
      return await sendEmail(opts);
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const is429 = /429|too many requests|rate limit/i.test(msg);
      if (is429 && attempt < maxAttempts) {
        const base = 300; // ms
        const delay = Math.min(base * 2 ** (attempt - 1) + Math.floor(Math.random() * 200), 3000);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }
      throw err;
    }
  }
}
