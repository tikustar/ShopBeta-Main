# ShopBeta — Phase 1: Foundation & Project Architecture

Scope: architecture only. No UI, layout, or styling changes; no auth/cart/checkout logic;
no Firestore writes or data migration.

## 1. Project architecture

New folders under `src/`:

| Folder        | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `firebase/`   | App/Firestore/Auth/Storage singletons, typed collection refs, converters |
| `services/`   | Data-access layer (`products.service`, `storage.service`)                |
| `types/`      | Domain models for existing + planned collections                         |
| `schemas/`    | Zod schemas used to validate untrusted Firestore documents               |
| `stores/`     | Zustand stores (structure only)                                          |
| `hooks/`      | Generic client hooks (`useDebouncedValue`, `useMounted`)                  |
| `utils/`      | Currency, date, string, Firestore and validation helpers                  |
| `constants/`  | Collection paths, currency/pagination/tag constants                      |
| `providers/`  | `AppProviders` — single client-provider composition point                 |

`src/lib/` is kept (existing `data.ts` static catalog powers the current UI) and
`src/lib/utils.ts` now re-exports the canonical helpers from `src/utils/` so every
existing import keeps working.

Dependencies installed: `firebase@12.16.0`, `zustand@5.0.14`, `zod@4.4.3`.

Files added: see the PR diff; the only modified existing files are
`src/app/layout.tsx` (wrapped children in `AppProviders`, no visual change) and
`src/lib/utils.ts` (re-exports).

## 2. Firebase

- Config moved to env vars (`.env.local`, template in `.env.example`);
  nothing is hardcoded in source.
- `getFirebaseApp()` / `getDb()` / `getFirebaseAuth()` / `getFirebaseStorage()` are
  memoized singletons — Firebase is never initialized ad hoc in a component.
- Connection verified against project `shop-day84j`: Firestore read OK, Auth
  instance OK, Storage bucket `shop-day84j.firebasestorage.app` resolved.

## 3. Firestore inspection (read-only)

Access used: the web API key with unauthenticated (rules-governed) reads, since no
service-account key or Firebase CLI login is available in this environment.

| Collection                       | Result                                     |
| -------------------------------- | ------------------------------------------ |
| `products`                       | Readable — 2 documents (`note100`, `pro001`) |
| every other name probed (~120)   | `PERMISSION_DENIED` or non-existent        |

Limitations, stated plainly:

- `listCollectionIds` is denied to client credentials, so the collection list could
  not be enumerated authoritatively. Collections other than `products` may exist but
  be unreadable; the probe cannot distinguish "does not exist" from "read denied".
- Anonymous auth is disabled (`ADMIN_ONLY_OPERATION`), so no authenticated read path
  was available either.
- Subcollections of the two product documents are also denied, so per-document
  subcollections cannot be confirmed.
- A service-account key (or `firebase login` + `firebase firestore` access) is needed
  to produce a complete, authoritative inventory.

Rules inference: `products` is world-readable; everything else requires auth.

## 4. Products collection analysis

Inferred from both live documents (`note100` is real Umidigi data, `pro001` is test data):

| Field           | Type                     | Present | Notes                                              |
| --------------- | ------------------------ | ------- | -------------------------------------------------- |
| `productName`   | string                   | 2/2     | Display name                                       |
| `description`   | string                   | 2/2     | Long marketing copy                                |
| `specification` | string                   | 2/2     | Newline-separated `Label: value` blob, not a map    |
| `price`         | number                   | 2/2     | Minor-unit-free integer (e.g. `127500`)             |
| `discount`      | number                   | 2/2     | Percentage (50, 25)                                |
| `rating`        | number                   | 2/2     | 0–5                                                |
| `imgs`          | array\<string>           | 2/2     | Remote URL on `note100`, base64 data URI on `pro001` |
| `variation`     | array\<string>           | 2/2     | Free-text colour options                            |
| `category`      | string                   | 2/2     | Free-text (`gadgets`), no id/reference              |
| `sponsored`     | boolean                  | 2/2     |                                                    |
| `officialStore` | boolean                  | 1/2     | `pro001` only                                       |
| `officalStore`  | boolean                  | 1/2     | **Misspelling** on `note100`                        |
| `reviews`       | array\<map>              | 1/2     | `{reviewBy, rating, comment, nice, date: timestamp}` |

Document ids are hand-written (`note100`, `pro001`), not auto-ids, and there is no
`slug` field — the current `/product/[slug]` route cannot resolve Firestore products
until slugs exist.

### Missing recommended fields

`slug`, `sku`, `barcode`, `categoryId`, `brandId`, `thumbnail`, `images` (normalized),
`stock`, `reviewCount`, `specifications` (structured), `variants` (structured),
`tags`, `featured`, `trending`, `flashSale`, `bestSeller`, `active`,
`createdAt`, `updatedAt`.

### Suggested migration strategy (Phase 2, additive only)

1. **Additive backfill script** (admin SDK, dry-run first): write only new fields, never
   delete or rewrite existing ones.
   - `slug` = `slugify(productName)`, uniqueness-suffixed; keep doc ids unchanged.
   - `images` = `imgs`; `thumbnail` = `imgs[0]`; move base64 images into Storage and
     replace with download URLs.
   - `specifications` = `parseSpecificationBlock(specification)` (already implemented in
     `src/utils/firestore.ts`), keeping the original string.
   - `variants` = `variation.map(...)`; `reviewCount` = `reviews.length`.
   - `createdAt`/`updatedAt` seeded from document `createTime`/`updateTime`.
   - `stock`, `sku`, `active: true`, `featured/trending/flashSale/bestSeller: false`.
2. **Normalize the `officalStore` typo** by writing the correct `officialStore` and
   leaving the legacy field in place; the converter already reads both.
3. **Reference data**: create `categories` and `brands`, derive `categoryId`/`brandId`
   from the free-text `category`, keep `category` for backwards compatibility.
4. **Extract reviews** to a top-level `reviews` collection once volume grows; keep the
   embedded array as the read path until then.
5. **Rules + indexes**: lock down writes to admins, keep `products` publicly readable,
   add composite indexes for `active + categoryId + price` and `active + createdAt`.

## 5. Generated assets

- **Types**: `Product`, `ProductDocument`, `EmbeddedProductReview`,
  `ProductSpecification`, `ProductVariantOption`, `Category*`, `Brand*`, `User*`,
  `Address`, `Order*`, `OrderItem`, `OrderTotals`, `Cart*`, `Wishlist*`, `Review*`,
  `Notification*`, plus `WithId`/`Timestamps`/`FirestoreDate` helpers.
- **Converters**: `productConverter` (legacy field names → normalized `Product`, both
  directions) and `createConverter<T>()` for the planned collections, wired into typed
  refs in `src/firebase/collections.ts`.
- **Schemas**: tolerant Zod schemas (`.loose()`, all-optional) so legacy documents never
  fail to parse.
- **Stores**: `useUserStore`, `useCartStore`, `useWishlistStore`, `useCheckoutStore`,
  `useSearchStore`, `useNotificationsStore` — state + setters + `reset()` only.
- **Utils**: `formatPrice`, `discountPercent`, `priceBeforeDiscount`, `applyDiscount`,
  `formatDate`, `formatDateTime`, `formatRelativeTime`, `toDate`, `toTimestamp`,
  `stripUndefined`, `parseSpecificationBlock`, `slugify`, `truncate`, `initials`,
  `isEmail`, `isPhone`, `isNonEmpty`, `parseOrUndefined`, `fieldErrors`.

## 6. Recommendations before Phase 2

1. Obtain a service-account key so the full Firestore inventory, rules and indexes can be
   audited authoritatively.
2. Seed real product data — 2 documents (one of them test data) is not enough to validate
   listing, filtering or pagination.
3. Decide the currency/price unit. UI formats as USD via `Intl`, but `127500` looks like
   NGN minor-or-major units; the pricing model should be explicit before checkout work.
4. Replace base64 images in Firestore with Storage URLs before the catalog grows — data
   URIs bloat documents and defeat image optimization.
5. Add `slug` before wiring `/product/[slug]` to Firestore.
6. Publish Firestore security rules and indexes as code (`firestore.rules`,
   `firestore.indexes.json`) in this repo.
7. Add a test setup (Vitest + React Testing Library) — the repo currently has none.
8. Consider TanStack Query for server-state caching, keeping Zustand for client state.
