export function startOfUTCDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
export function diffDaysUTC(a: Date, b: Date) {
  const ms = startOfUTCDay(a).getTime() - startOfUTCDay(b).getTime();
  return Math.round(ms / 86_400_000);
}
