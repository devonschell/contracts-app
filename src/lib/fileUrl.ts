export function fileUrl(u?: string | null) {
  if (!u) return "#";
  // If it's already an absolute URL (Vercel Blob), return as-is
  if (/^https?:\/\//i.test(u)) return u;
  // Legacy local paths like "/uploads/xyz.pdf" need a site prefix in production
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  return base.replace(/\/$/, "") + u;
}
