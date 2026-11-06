/**
 * Legacy ShopBeta domain -> Zenvexa canonical domain (308, path + query preserved).
 * Enabled only once ENABLE_LEGACY_DOMAIN_REDIRECT=true after the new domain is verified.
 * Excluded: /api/* (gateway webhooks must not be redirected) and payment return pages
 * (in-flight payments finish on the origin that holds the customer's session).
 */
const CANONICAL_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.zenvexacommerce.com"
).replace(/\/$/, "");
const LEGACY_HOSTS = "(?:www\\.)?shopbetaa\\.store";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // jwks-rsa (firebase-admin/auth) calls require("jose"), but jose 6 is ESM-only.
  // Bundling it through webpack resolves the import correctly in serverless functions.
  transpilePackages: ["jwks-rsa"],
  async redirects() {
    if (process.env.ENABLE_LEGACY_DOMAIN_REDIRECT !== "true") return [];
    if (!/^https:\/\/(www\.)?zenvexacommerce\.com$/.test(CANONICAL_ORIGIN))
      throw new Error(
        "ENABLE_LEGACY_DOMAIN_REDIRECT requires NEXT_PUBLIC_SITE_URL to be the Zenvexa domain.",
      );
    return [
      {
        source: "/",
        has: [{ type: "host", value: LEGACY_HOSTS }],
        destination: `${CANONICAL_ORIGIN}/`,
        permanent: true,
      },
      {
        source: "/:path((?!api/|payments(?:/|$)|payment/).+)",
        has: [{ type: "host", value: LEGACY_HOSTS }],
        destination: `${CANONICAL_ORIGIN}/:path`,
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "i.dummyjson.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
