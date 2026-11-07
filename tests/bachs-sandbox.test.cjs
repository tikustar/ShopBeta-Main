const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac, randomUUID } = require("node:crypto");
const { database } = require("./payment-test-helpers.cjs");
const { createSandboxHandler, signatureValid, fingerprint } = require("../functions/src/bachsSandbox");
const API = "sk_sandbox_fixture";
const SECRET = "whsec_fixture";
const root = "privateBachsSandbox/registry";

function recordsFor(reference = "fixture") {
  return {
    "privateBachsSandbox/config": { enabled: true, apiKey: API, webhookSecret: SECRET },
    [`${root}/payments/${reference}`]: { environment: "sandbox", storeId: "shopbeta", reference, accountFingerprint: fingerprint(API), checkoutId: "chk_fixture", orderId: reference, inventoryId: reference, amountMinor: 10000, currency: "NGN", quantity: 1, status: "processing" },
    [`${root}/orders/${reference}`]: { environment: "sandbox", reference, totalMinor: 10000, paymentStatus: "processing", orderDate: "2026-01-01T00:00:00Z" },
    [`${root}/inventory/${reference}`]: { environment: "sandbox", stock: 5 },
    "orders/customer": { paymentStatus: "processing" },
    "products/customer": { stock: 20 },
  };
}
function request(reference = "fixture", secret = SECRET, type = "collection.succeeded") {
  const rawBody = Buffer.from(JSON.stringify({ id: "evt_fixture", type, data: { reference, checkout_id: "chk_fixture" } }));
  const ts = String(Math.floor(Date.now() / 1000));
  return { method: "POST", rawBody, headers: { "x-bachs-signature-v2": `t=${ts}, v1=${createHmac("sha256", secret).update(`${ts}.`).update(rawBody).digest("hex")}` } };
}
function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function session(reference = "fixture") { return { checkout_id: "chk_fixture", reference, metadata: { sandboxRun: reference }, status: "completed", payment_status: "succeeded", amount: "100.00", currency: "NGN" }; }
function fixture() {
  const f = database(recordsFor());
  const run = f.db.runTransaction.bind(f.db);
  let queue = Promise.resolve();
  f.db.runTransaction = (fn) => { const result = queue.then(() => run(fn)); queue = result.catch(() => {}); return result; };
  let calls = 0;
  f.reply = session();
  f.http = 200;
  f.handler = createSandboxHandler({ getDb: () => f.db, timestamp: () => "now", fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, "https://sandbox-api.bachs.io/v1/checkout-sessions/chk_fixture");
    assert.equal(init.headers.Authorization, `Bearer ${API}`);
    assert.equal(init.redirect, "error");
    return new Response(JSON.stringify(f.reply), { status: f.http });
  } });
  f.calls = () => calls;
  return f;
}
function productionUnchanged(f) {
  assert.deepEqual(f.records.get("orders/customer"), { paymentStatus: "processing" });
  assert.deepEqual(f.records.get("products/customer"), { stock: 20 });
}

test("sandbox accepts authentic signatures including whitespace/rotation, rejects forged and stale signatures", () => {
  const req = request();
  assert.equal(signatureValid(req.rawBody, req.headers, SECRET), true);
  assert.equal(signatureValid(req.rawBody, req.headers, "wrong"), false);
  assert.equal(signatureValid(Buffer.from("tampered"), req.headers, SECRET), false);
  assert.equal(signatureValid(req.rawBody, req.headers, SECRET, Date.now() + 600000), false);
  assert.equal(signatureValid(req.rawBody, {}, SECRET), false);
});
test("sandbox settlement atomically records one notification and deducts only isolated stock under concurrent deliveries", async () => {
  const f = fixture();
  const responses = await Promise.all(Array.from({ length: 5 }, async () => { const res = response(); assert.equal(await f.handler(request(), res), true); return res; }));
  assert.ok(responses.every(r => r.code === 200));
  assert.equal(f.records.get(`${root}/payments/fixture`).status, "paid");
  assert.equal(f.records.get(`${root}/orders/fixture`).paymentStatus, "paid");
  assert.equal(f.records.get(`${root}/inventory/fixture`).stock, 4);
  assert.equal([...f.records.keys()].filter(k => k.startsWith(`${root}/notifications/`)).length, 1);
  const payload = f.records.get(`${root}/notifications/fixture`).payload;
  for (const k of ["customerName", "customerEmail", "phoneNumber", "orderId", "orderDate", "expectedDelivery", "shippingAddress", "subtotal", "products", "deliveryFee", "discount", "totalPrice", "paymentStatus", "paymentMethod", "reference", "orderStatus"]) assert.ok(Object.hasOwn(payload, k), k);
  productionUnchanged(f);
});
for (const [label, mutate, expected] of [
  ["signature", () => {}, 401],
  ["unknown reference", () => {}, 404],
  ["live API key", f => { f.records.get("privateBachsSandbox/config").apiKey = "sk_live_forbidden"; }, 503],
  ["disabled config", f => { f.records.get("privateBachsSandbox/config").enabled = false; }, 503],
  ["account fingerprint", f => { f.records.get(`${root}/payments/fixture`).accountFingerprint = "other"; }, 409],
  ["production order reference", f => { f.records.get(`${root}/payments/fixture`).orderId = "customer"; }, 409],
  ["production inventory reference", f => { f.records.get(`${root}/payments/fixture`).inventoryId = "customer"; }, 409],
  ["amount", f => { f.reply.amount = "1.00"; }, 409],
  ["currency", f => { f.reply.currency = "USD"; }, 409],
  ["reference", f => { f.reply.reference = "other"; }, 409],
  ["checkout", f => { f.reply.checkout_id = "chk_other"; }, 409],
  ["metadata", f => { f.reply.metadata.sandboxRun = "other"; }, 409],
  ["upstream account", f => { f.reply.account_id = "other"; }, 409],
  ["upstream 401", f => { f.http = 401; f.reply = { error_code: "UNAUTHORIZED" }; }, 502],
  ["upstream 500", f => { f.http = 500; f.reply = {}; }, 502],
  ["pending", f => { f.reply.status = "open"; f.reply.payment_status = "processing"; }, 200],
  ["failed", f => { f.reply.status = "open"; f.reply.payment_status = "failed"; }, 200],
]) {
  test(`sandbox fails closed for ${label}`, async () => {
    const f = fixture(); mutate(f);
    const req = label === "signature" ? request("fixture", "invalid") : label === "unknown reference" ? request("customer") : request();
    const res = response();
    assert.equal(await f.handler(req, res), true);
    assert.equal(res.code, expected);
    assert.equal(f.records.get(`${root}/orders/fixture`).paymentStatus, "processing");
    assert.equal(f.records.get(`${root}/inventory/fixture`).stock, 5);
    assert.equal(f.records.has(`${root}/notifications/fixture`), false);
    productionUnchanged(f);
  });
}
test("live deliveries are not consumed by sandbox dispatch", async () => {
  const f = fixture();
  assert.equal(await f.handler(request("live_reference", "live_secret"), response()), false);
  assert.equal(f.calls(), 0);
  productionUnchanged(f);
});
test("sandbox registry still rejects missing signing configuration instead of falling through", async () => {
  const f = fixture();
  delete f.records.get("privateBachsSandbox/config").webhookSecret;
  const res = response();
  assert.equal(await f.handler(request(), res), true);
  assert.equal(res.code, 401);
  assert.equal(f.calls(), 0);
});

test("registered Cloud Function dispatches authenticated sandbox traffic before any live router or finalizer", async () => {
  const f = fixture();
  const module = { exports: {} };
  const originalFetch = global.fetch;
  let liveCalls = 0;
  const forbidden = () => { liveCalls++; throw Error("Production path invoked"); };
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "../functions/src/bachsWebhook.js"), "utf8");
  new Function("require", "module", "exports", source)((name) => {
    if (name === "./store-routing") return { routeStoreWebhook: forbidden };
    if (name === "./bachsSandbox") return require("../functions/src/bachsSandbox");
    if (name === "firebase-functions/v2/https") return { onRequest: (_options, fn) => fn };
    if (name === "firebase-admin/firestore") return { getFirestore: () => f.db, FieldValue: { serverTimestamp: () => "now" } };
    if (name === "./finalizeShared") return { log() {}, finalizeSuccessfulPayment: forbidden, finalizeCodCommitmentFee: forbidden, notifyMake: forbidden };
    return require(name);
  }, module, module.exports);
  global.fetch = async () => new Response(JSON.stringify(session()), { status: 200 });
  try {
    const res = response();
    await module.exports.bachsWebhook(request(), res);
    assert.equal(res.code, 200);
    assert.equal(liveCalls, 0);
    productionUnchanged(f);
  } finally { global.fetch = originalFetch; }
});

test("Firestore emulator: concurrent sandbox events change only isolated test documents", { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):\d+$/);
  const { initializeApp } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  const { deleteApp } = require("firebase-admin/app");
  const app = initializeApp({ projectId: "demo-store-scope" }, "sandbox-test-" + randomUUID());
  const db = getFirestore(app);
  const ref = "SBX" + randomUUID().replaceAll("-", "");
  const records = recordsFor(ref);
  for (const [key, value] of Object.entries(records)) await db.doc(key).set(value);
  const handler = createSandboxHandler({ getDb: () => db, timestamp: () => new Date(), fetchImpl: async () => new Response(JSON.stringify(session(ref)), { status: 200 }) });
  try {
    const results = await Promise.all(Array.from({ length: 8 }, async () => { const res = response(); await handler(request(ref), res); return res; }));
    assert.ok(results.every(r => r.code === 200));
    assert.equal((await db.doc(`${root}/inventory/${ref}`).get()).data().stock, 4);
    assert.equal((await db.doc(`${root}/orders/${ref}`).get()).data().paymentStatus, "paid");
    assert.equal((await db.doc("orders/customer").get()).data().paymentStatus, "processing");
    assert.equal((await db.doc("products/customer").get()).data().stock, 20);
    assert.equal((await db.doc(`${root}/notifications/${ref}`).get()).exists, true);
  } finally { await db.terminate(); await deleteApp(app); }
});
