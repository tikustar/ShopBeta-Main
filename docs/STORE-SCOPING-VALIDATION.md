# Store-scoping validation

Reference implementation: `def519860dd55cbe1859297243e354838932faf7` on Zenvexa's `feat/store-scoped-commerce`.

ShopBeta adapter: `feat/shopbeta-store-scoping`, based on ShopBeta `f51af93`. Only the contract patch is ported; Zenvexa history, branding, catalog imports and deployment projects are not merged.

## Passed in this workspace

- Production `npm run build`: compilation, ESLint and TypeScript checks pass.
- 84 direct mocked tests: store/context/auth/creation/query/signature boundaries 19; settings/secret writes 6; Squad 18; Monnify 22; Bachs 10; COD 9. Adapter additions cover required identity variables, authenticated guest/staff order-number resolution, independent ShopBeta settings/stats, preserved historical fields during overlap, and distinct Bachs retry idempotency keys.
- Seven Firestore emulator tests using the demo project: required/matching store identity, blank-name rejection, public/private reads, authorized secret writes, immutable order/payment attribution and credential pointers, old ShopBeta writer compatibility, namespaced counter validation.
- Migration integration against a disposable loopback Firestore emulator: private checksummed backup, dry-run no writes, exclusive cutoff, explicit store preservation, unknown dates/names, conditional concurrent-write conflicts, reruns, explicit final ShopBeta refresh, transaction-owned rollback, and tamper rejection. These are fictional fixtures, not live data.
- `npm run lint` and `npx tsc --noEmit` pass. Production builds pass; one run logged Firestore network/DNS warnings and fallback catalog output, and the final run logged the handled relative payment-settings fetch warning during prerender. Neither is a deployed catalog/payment acceptance test. Upstream Zenvexa's Chromium/Hug Bag checks are not claimed for this ShopBeta adapter.
- Local production-server HTTP smoke: homepage 200; disabled diagnostic endpoint 404; unauthenticated POST /api/orders 401; missing order lookup/tracking input 400. No payment or database mutation was requested.
- Git whitespace checks and syntax checks for the new migration/function modules.

The expected rules PERMISSION_DENIED logs prove forbidden operations were rejected. The migration tamper test intentionally invokes a failing plan-integrity check. Those expected failures do not represent test failures. Emulator Google metadata lookup warnings are unrelated to production configuration.

## Reproduce

```sh
npm ci
npm run test:stores
npm run test:squad
npm run test:monnify
npm run test:bachs
npm run test:cod
npm run test:rules
npm run test:migration
npm run build
```

Rules/migration emulator commands use `firebase.test.json`, the `demo-store-scope` project and loopback port 8089. They require Java 21+ and Firebase CLI (the npm scripts obtain it using npx). `@firebase/rules-unit-testing` is a development dependency. Both helpers and actual server modules are exercised; the legacy provider primitive suites stub only the newly added request middleware, which has its own actual boundary tests.

## Not performed / release gates

No live migration plan, live backup, production database write, shared rules/index/function deployment, Vercel environment change, domain update or payment charge was performed for this adapter. Existing credentials were not copied, inspected or reset. Deployment environment configuration, Auth enablement/domains and coordinated backend release remain operator tasks.

Consequently live record counts/conflicts, actual settings contents, authorized domains, each enabled provider's account/callback configuration, refunds/emails and deployed cross-store behavior remain release checks. The build without credentials renders unavailable-catalog states; that is not evidence of successful live catalog or checkout access.

Follow the coordinated rollout in `STORE-SCOPING.md`. Keep Zenvexa providers disabled until its own configuration and the shared webhook bridge are ready. Release this ShopBeta adapter initially with the cutover flag false, then final-refresh and switch consistently in both deployments. Do not merge/deploy this as a storefront-only change without the backend/companion steps.

## Fictional dry-run fixture results

The loopback `demo-store-scope` fixture scans seven orders: two are reported ambiguous (unknown store or missing date), two are skipped (explicit stable attribution and the exact cutoff), and three produce attribution patches. Along with missing configuration/private targets, the initial plan proposes eight mutations and contains 15 backup entries, including target-absence snapshots. The concurrency test changes one candidate after planning; apply leaves that record untouched and reports a conflict. Rerun performs no additional mutations for the already applied entries. An explicit final-refresh plan and both rollback paths are then verified. These counts describe only the disposable emulator fixture, not production data.
