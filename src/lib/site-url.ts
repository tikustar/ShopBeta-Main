/**
 * Canonical public origin. www is primary; the apex redirects to it at the Vercel
 * domain level. Deployments should still set NEXT_PUBLIC_SITE_URL/NEXT_PUBLIC_APP_URL
 * explicitly — this is only the fallback when those variables are absent.
 */
export const CANONICAL_SITE_URL = "https://www.zenvexacommerce.com";

/** Previous production origin; kept serving until the new domain is verified. */
export const LEGACY_SITE_URL = "https://www.shopbetaa.store";

function normalize(value: string | undefined) {
  return value?.trim().replace(/\/$/, "") || undefined;
}

export function publicSiteUrl() {
  return (
    normalize(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalize(process.env.NEXT_PUBLIC_APP_URL) ||
    CANONICAL_SITE_URL
  );
}
