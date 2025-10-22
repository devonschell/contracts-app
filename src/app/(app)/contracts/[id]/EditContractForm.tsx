"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "ACTIVE" | "REVIEW" | "TERMINATED";

// ✅ Helper: normalize dates to noon UTC before saving
function toUtcNoonIso(dateLike: string | Date | null | undefined) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  d.setUTCHours(12, 0, 0, 0); // locks to noon UTC so you don’t lose a day
  return d.toISOString();
}

export default function EditContractForm(props: {
  id: string;
  initial: {
    counterparty: string;
    title: string;
    status: Status;
    renewalDate: string | null;
    monthlyFee?: number | null;
    lateFeePct?: number | null;
    renewalNoticeDays?: number | null;
    termLengthMonths?: number | null;
    autoRenew?: boolean | null;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [counterparty, setCounterparty] = useState(props.initial.counterparty);
  const [title, setTitle] = useState(props.initial.title);
  const [status, setStatus] = useState<Status>(props.initial.status);
  const [renewalDate, setRenewalDate] = useState<string | null>(
    props.initial.renewalDate
  );

  const [monthlyFee, setMonthlyFee] = useState<number | "" | null>(
    props.initial.monthlyFee ?? ""
  );
  const [lateFeePct, setLateFeePct] = useState<number | "" | null>(
    props.initial.lateFeePct ?? ""
  );
  const [renewalNoticeDays, setRenewalNoticeDays] = useState<number | "" | null>(
    props.initial.renewalNoticeDays ?? ""
  );
  const [termLengthMonths, setTermLengthMonths] = useState<number | "" | null>(
    props.initial.termLengthMonths ?? ""
  );
  const [autoRenew, setAutoRenew] = useState<boolean>(
    Boolean(props.initial.autoRenew)
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ✅ Normalize the date before sending
    const payload = {
      counterparty,
      title,
      status,
      renewalDate: toUtcNoonIso(renewalDate),
      monthlyFee: monthlyFee === "" ? null : Number(monthlyFee),
      lateFeePct: lateFeePct === "" ? null : Number(lateFeePct),
      renewalNoticeDays:
        renewalNoticeDays === "" ? null : Number(renewalNoticeDays),
      termLengthMonths:
        termLengthMonths === "" ? null : Number(termLengthMonths),
      autoRenew,
    };

    startTransition(async () => {
      const res = await fetch(`/api/contracts/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "Update failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Counterparty</div>
          <input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Status</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="REVIEW">Review</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Renewal date</div>
          <input
            type="date"
            value={renewalDate || ""}
            onChange={(e) => setRenewalDate(e.target.value || null)}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-gray-600 mb-1">Monthly fee (USD)</div>
          <input
            inputMode="decimal"
            placeholder="e.g. 499.00"
            value={monthlyFee === null ? "" : monthlyFee}
            onChange={(e) =>
              setMonthlyFee(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Late fee (%)</div>
          <input
            inputMode="decimal"
            placeholder="e.g. 1.5"
            value={lateFeePct === null ? "" : lateFeePct}
            onChange={(e) =>
              setLateFeePct(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Renewal notice (days)</div>
          <input
            inputMode="numeric"
            placeholder="e.g. 30"
            value={renewalNoticeDays === null ? "" : renewalNoticeDays}
            onChange={(e) =>
              setRenewalNoticeDays(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Term length (months)</div>
          <input
            inputMode="numeric"
            placeholder="e.g. 12"
            value={termLengthMonths === null ? "" : termLengthMonths}
            onChange={(e) =>
              setTermLengthMonths(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoRenew}
          onChange={(e) => setAutoRenew(e.target.checked)}
        />
        Auto-renew
      </label>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-md bg-black px-3 py-2 text-white text-sm disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
