"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewContractButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createContract = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contracts/new", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Failed to create");
      router.push(`/contracts/${json.id}`);
    } catch (e: any) {
      alert(e.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={createContract}
      disabled={loading}
      className="rounded-md bg-black px-3 py-1.5 text-white text-sm disabled:opacity-60"
    >
      {loading ? "Creating…" : "New Contract"}
    </button>
  );
}
