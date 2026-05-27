/**
 * Returns the canonical site URL (no trailing slash).
 * Order: NEXT_PUBLIC_SITE_URL → Vercel production URL → localhost
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = siteUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
