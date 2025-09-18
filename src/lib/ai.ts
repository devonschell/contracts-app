import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- SUMMARY ---------- */

const SUMMARIZE_INSTRUCTIONS = `
Summarize the contract for a business user. Use short labels and bullets.
If a field is unknown, use "—" (em dash).

Parties & Contract Title:
- Provider: ...
- Customer: ...
- Contract Title: ...

Term & Renewal Window:
- Initial Term: ...
- Renewal Window: ...
- First Renewal Date: ...

Fees / Pricing / Payment Terms:
- ...

Termination Rights & Notice:
- ...

Key Obligations / SLAs / Deliverables:
- ...

Auto-Renew Traps / Unusual Clauses:
- ...
`.trim();

export async function summarizeContract(text: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const clipped = text ? text.slice(0, 100_000) : "";
  console.log("[ai] summarize len:", clipped.length, "key?", !!process.env.OPENAI_API_KEY);

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "You are a precise paralegal. Be concise and factual." },
      { role: "user", content: `${SUMMARIZE_INSTRUCTIONS}\n\n--- CONTRACT TEXT ---\n${clipped}` },
    ],
  });

  const out = res.choices[0]?.message?.content?.trim() || "";
  return out;
}

/* ---------- STRUCTURED META ---------- */

export type ContractMeta = {
  provider: string | null;
  customer: string | null;
  contractTitle: string | null;

  startDateISO: string | null;
  endDateISO: string | null;
  renewalDateISO: string | null;

  termLengthMonths: number | null;
  renewalNoticeDays: number | null;
  autoRenew: boolean | null;

  monthlyFee: number | null;
  annualFee: number | null;
  lateFeePct: number | null;

  billingCadence: string | null; // MONTHLY | ANNUAL | QUARTERLY | OTHER
  paymentCadence: string | null; // MONTHLY | ANNUAL | QUARTERLY | OTHER

  unusualClauses: string[] | null;
  terminationRights: string[] | null;
};

export async function extractContractMeta(
  text: string,
  opts: { myCompanyName?: string | null } = {}
): Promise<ContractMeta | null> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const clipped = text ? text.slice(0, 100_000) : "";
  console.log("[ai] extract meta len:", clipped.length, "key?", !!process.env.OPENAI_API_KEY);

  const schema = `
Return ONLY strict JSON with this exact shape. Use null when unknown.

{
  "provider": string|null,
  "customer": string|null,
  "contractTitle": string|null,

  "startDateISO": string|null,
  "endDateISO": string|null,
  "renewalDateISO": string|null,

  "termLengthMonths": number|null,
  "renewalNoticeDays": number|null,
  "autoRenew": boolean|null,

  "monthlyFee": number|null,
  "annualFee": number|null,
  "lateFeePct": number|null,

  "billingCadence": "MONTHLY"|"QUARTERLY"|"ANNUAL"|null,
  "paymentCadence": "MONTHLY"|"QUARTERLY"|"ANNUAL"|null,

  "unusualClauses": string[]|null,
  "terminationRights": string[]|null
}

My company (if mentioned) is: ${opts.myCompanyName || "Unknown"}.
`.trim();

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: "Extract structured fields from the contract text. Be literal and precise." },
      { role: "user", content: `${schema}\n\n--- CONTRACT TEXT ---\n${clipped}` },
    ],
    response_format: { type: "json_object" }, // ensures valid JSON output
  });

  const raw = res.choices[0]?.message?.content || "{}";
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    // last-resort: try to salvage a JSON object inside
    const m = raw.match(/\{[\s\S]*\}$/);
    json = m ? safeParse(m[0]) : {};
  }

  // Basic normalization so the rest of the app is happy
  if (json && typeof json === "object") {
    if (typeof json.billingCadence === "string") json.billingCadence = json.billingCadence.toUpperCase();
    if (typeof json.paymentCadence === "string") json.paymentCadence = json.paymentCadence.toUpperCase();
    if (!Array.isArray(json.unusualClauses) && json.unusualClauses != null) json.unusualClauses = [];
    if (!Array.isArray(json.terminationRights) && json.terminationRights != null) json.terminationRights = [];
  }

  return json as ContractMeta;
}

/* ---------- small helper ---------- */
function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
