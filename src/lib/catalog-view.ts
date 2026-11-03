import {
  isIconKey,
  type Brand as BrandView,
  type Category as CategoryView,
  type IconKey,
} from "@/lib/data";
import type { Brand, Category } from "@/types/catalog";
import { APP_NAME, withBrandName } from "@/constants/app";

const TONES = [
  "bg-[#EEF7F2]",
  "bg-[#FFF8E5]",
  "bg-[#F3F8F4]",
  "bg-[#FBF5E3]",
  "bg-[#EAF4EE]",
  "bg-[#F7F8F1]",
] as const;

/** Ordered: more specific category names first. Icons only — never product imagery. */
const ICON_KEYWORDS: Array<[RegExp, IconKey]> = [
  [/glasses|sunglass|eyewear/, "glasses"],
  [/power ?bank|power station|jackery|battery|solar|generator|inverter/, "battery"],
  [/calculator/, "calculator"],
  [/shoe|sneaker|footwear|sandal/, "footprints"],
  [/\bbags?\b|handbag|purse|luggage/, "handbag"],
  [/jewel|necklace|bracelet|earring/, "gem"],
  [/watch/, "watch"],
  [/shirt|\btops?\b|dress|cloth|fashion|wear/, "shirt"],
  [/\btv\b|television|android box|streaming/, "tv"],
  [/motorcycle|motorbike|bike|scooter/, "bike"],
  [/vehicle|\bcars?\b|automotive|auto parts/, "car"],
  [/sport|fitness|gym|exercise/, "dumbbell"],
  [/\bballs?\b|football|soccer|basketball/, "ball"],
  [/skin|lotion|cream|body care/, "droplets"],
  [/fragrance|perfume|cologne/, "fragrance"],
  [/beauty|makeup|cosmetic/, "sparkles"],
  [/furniture|sofa|chair|bed\b/, "sofa"],
  [/grocer|food|pantry|beverage|drink/, "basket"],
  [/kitchen|cook|utensil/, "cookware"],
  [/decor|home|living|lighting/, "lamp"],
  [/laptop|computer|notebook|pc\b/, "laptop"],
  [/tablet|ipad/, "tablet"],
  [/headphone|earbud|audio|speaker/, "headphones"],
  [/mobile accessor|cable|charger|adapter/, "cable"],
  [/phone|smartphone|mobile/, "smartphone"],
  [/camera|photo/, "camera"],
  [/gaming|console|game/, "gamepad"],
];

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total + value.charCodeAt(index) * (index + 1)) % 997;
  }
  return total;
}

function iconFor(category: Category): IconKey {
  const haystack = `${category.name} ${category.slug.replace(/-/g, " ")}`.toLowerCase();
  const matched = ICON_KEYWORDS.find(([pattern]) => pattern.test(haystack))?.[1];
  if (matched) return matched;
  return isIconKey(category.icon) ? category.icon : "grid";
}

export function toCategoryView(category: Category): CategoryView {
  return {
    name: category.name,
    slug: category.slug,
    icon: iconFor(category),
    itemCount: category.productCount ?? 0,
    tone: TONES[hash(category.slug) % TONES.length],
    subcategories: category.subcategories?.length
      ? category.subcategories
      : [category.name],
    description: withBrandName(
      category.description ??
        `Explore ${category.name.toLowerCase()} products on ${APP_NAME}.`,
    ),
  };
}

export function toCategoryViews(categories: Category[]): CategoryView[] {
  return categories.map(toCategoryView);
}

export function toBrandView(brand: Brand): BrandView {
  const initials = brand.name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    name: brand.name,
    slug: brand.slug,
    initials: initials || "ZX",
    productCount: brand.productCount ?? 0,
    featured: Boolean(brand.featured),
    category: "Catalogue",
  };
}

export function toBrandViews(brands: Brand[]): BrandView[] {
  return brands.map(toBrandView);
}
