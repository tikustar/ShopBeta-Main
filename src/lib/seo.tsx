import type { Metadata } from "next";
import type { Product } from "@/types/product";
import type { Brand, Category } from "@/types/catalog";
import { APP_NAME, CURRENCY } from "@/constants/app";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://shopbeta.app";

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function productCanonicalPath(product: Product) {
  return `/product/${product.slug || product.id}`;
}

export function categoryCanonicalPath(category: Category) {
  return `/category/${category.slug}`;
}

export function buildProductMetadata(product: Product): Metadata {
  const title = product.name;
  const description =
    product.description?.slice(0, 160) ||
    `${product.name} available on ${APP_NAME}.`;
  const image = product.thumbnail ?? product.images[0];
  const url = absoluteUrl(productCanonicalPath(product));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} · ${APP_NAME}`,
      description,
      siteName: APP_NAME,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${APP_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildCategoryMetadata(category: Category): Metadata {
  const title = category.name;
  const description =
    category.description?.slice(0, 160) ||
    `Shop ${category.name} on ${APP_NAME}.`;
  const url = absoluteUrl(categoryCanonicalPath(category));
  const image = category.image;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} · ${APP_NAME}`,
      description,
      siteName: APP_NAME,
      images: image ? [{ url: image, alt: category.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${APP_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildBrandMetadata(brand: Brand): Metadata {
  const title = brand.name;
  const description =
    brand.description?.slice(0, 160) || `Shop ${brand.name} on ${APP_NAME}.`;
  const url = absoluteUrl(`/products?brand=${brand.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} · ${APP_NAME}`,
      description,
      siteName: APP_NAME,
    },
  };
}

export function buildListingMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${input.title} · ${APP_NAME}`,
      description: input.description,
      siteName: APP_NAME,
    },
  };
}

export function productJsonLd(product: Product) {
  const image = product.images.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku ?? product.id,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    image,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productCanonicalPath(product)),
      priceCurrency: CURRENCY.code,
      price: product.price,
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path ? absoluteUrl(item.path) : undefined,
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
