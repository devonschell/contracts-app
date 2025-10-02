// src/lib/notify.ts
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.ALERTS_FROM || "Contract Alerts <alerts@example.com>";

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

export async function sendEmail(opts: { to: string[]; subject: string; html: string }) {
  // Fallback to console logging if no key or in test-like env
  if (!resend) {
    console.log("[EMAIL:SIMULATED]", {
      to: opts.to,
      subject: opts.subject,
      preview: opts.html.slice(0, 160) + (opts.html.length > 160 ? "...(truncated)" : ""),
    });
    return;
  }

  const { to, subject, html } = opts;

  const result = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (result.error) {
    // Normalize to throw so caller writes a NotificationLog with ERROR
    throw new Error(result.error.message || "Email send failed");
  }
}
