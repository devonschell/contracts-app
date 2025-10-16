export function fileUrl(url: string | null | undefined) {
  if (!url) return "#";
  // If it's already an absolute Blob URL, just return it
  if (url.startsWith("http")) return url;

  // Otherwise it's a relative path like "/uploads/..."
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${url}`;
}
