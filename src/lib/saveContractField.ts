export async function saveContractField(contractId: string, field: string, value: any) {
  const res = await fetch(`/api/contracts/${contractId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, value }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) throw new Error(json?.error || `Save failed (${res.status})`);
  return json.data;
}
