process.env.NEXT_PUBLIC_STORE_ID = "shopbeta";
process.env.STORE_ID = "shopbeta";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const { loader, database, withFetch } = require("./payment-test-helpers.cjs");

const SECRET = "whsec_sandbox_test";

function sign(secret, timestamp, body) {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

const verifySignature = () =>
  loader()("@/lib/server/bachs").verifyBachsWebhookSignature;

test("bachs v2 signature accepts a valid delivery and rejects forgeries", () => {
  const verify = verifySignature();
  const body = JSON.stringify({ type: "collection.succeeded", data: {} });
  const ts = String(Math.floor(Date.now() / 1000));
  const v1 = sign(SECRET, ts, body);
  assert.equal(
    verify(body, { signatureV2: `t=${ts},v1=${v1}` }, [SECRET]),
    true,
  );
  // Legacy v1 header
  assert.equal(verify(body, { signature: v1, timestamp: ts }, [SECRET]), true);
  // Wrong secret
  assert.equal(
    verify(body, { signatureV2: `t=${ts},v1=${v1}` }, ["wrong-secret"]),
    false,
  );
  // Tampered body
  assert.equal(
    verify(body + "x", { signatureV2: `t=${ts},v1=${v1}` }, [SECRET]),
    false,
  );
  // Stale timestamp (replay)
  const old = String(Math.floor(Date.now() / 1000) - 600);
  assert.equal(
    verify(body, { signature: sign(SECRET, old, body), timestamp: old }, [
      SECRET,
    ]),
    false,
  );
  // Missing pieces
  assert.equal(verify(body, {}, [SECRET]), false);
  assert.equal(verify(body, { signatureV2: `t=${ts},v1=${v1}` }, []), false);
});

test("Bachs signature accepts optional whitespace between v2 header entries", () => {
  const body = "payload";
  const ts = String(Math.floor(Date.now() / 1000));
  assert.equal(verifySignature()(body, { signatureV2: `t=${ts}, v1=${sign(SECRET, ts, body)}` }, [SECRET]), true);
});

test("bachs v2 accepts any matching v1 entry during secret rotation", () => {
  const verify = verifySignature();
  const body = "payload";
  const ts = String(Math.floor(Date.now() / 1000));
  const old = sign("old-secret", ts, body);
  const current = sign(SECRET, ts, body);
  assert.equal(
    verify(body, { signatureV2: `t=${ts},v1=${old},v1=${current}` }, [SECRET]),
    true,
  );
  // Either configured environment secret may sign.
  assert.equal(
    verify(body, { signatureV2: `t=${ts},v1=${old}` }, [SECRET, "old-secret"]),
    true,
  );
});

function fixture({ purpose } = {}) {
  const { db, records } = database({
    "orders/order-1": {
      id: "order-1",
      orderNumber: "SB-1001",
      userId: "user-1",
      paymentMethod: purpose ? "cash-on-delivery" : "bachs",
      paymentStatus: "processing",
      commitmentFeeStatus: purpose ? "processing" : undefined,
      codCommitmentFee: purpose ? 25 : undefined,
      paymentReference: "BA" + "a".repeat(32),
      customer: { email: "customer@example.com", name: "Customer" },
      products: [{ productId: "product-1", name: "Shoe", quantity: 1 }],
      total: purpose ? 100 : 100,
      totals: { total: purpose ? 100 : 100 },
    },
    "products/product-1": { id: "product-1", stock: 8, salesCount: 0 },
    "payments/pay-1": {
      id: "pay-1",
      orderId: "order-1",
      orderNumber: "SB-1001",
      gateway: "bachs",
      purpose,
      reference: "BA" + "a".repeat(32),
      amount: purpose ? 25 : 100,
      currency: "NGN",
      status: "processing",
      checkoutId: "chk_test123",
      metadata: { sandbox: false },
    },
  });
  let notifications = 0;
  const load = loader({
    "@/lib/server/firebase-admin": {
      getAdminDb: () => db,
      isFirebaseAdminConfigured: () => true,
    },
    "@/lib/server/bachs-settings": {
      getBachsConfiguration: async () => ({
        enabled: true,
        sandbox: false,
        apiKey: "sk_live_test",
        webhookSecret: SECRET,
      }),
      getBachsWebhookSecrets: async () => [SECRET],
    },
    "@/lib/server/make-webhook": {
      // Mirror the real dedupe: makeNotifyStatus "sent" on the order skips resend.
      notifyMakeOrderPaid: async ({ order }) => {
        const path = `orders/${order.id}`;
        const latest = records.get(path);
        if (latest?.makeNotifyStatus === "sent" && latest?.makeNotifiedAt)
          return { ok: true, skipped: true };
        records.set(path, {
          ...latest,
          makeNotifyStatus: "sent",
          makeNotifiedAt: "t",
        });
        notifications++;
        return { ok: true };
      },
    },
  });
  return {
    db,
    records,
    load,
    reference: "BA" + "a".repeat(32),
    session: (status) => ({
      pricing: { amount: String(purpose ? 25 : 100), currency: "NGN" },
      checkout_id: "chk_test123",
      checkout_url: "https://checkout.bachs.io/c/abc",
      status,
      reference: "BA" + "a".repeat(32),
    }),
    notifications: () => notifications,
  };
}

function sessionResponse(session) {
  return async (url) =>
    new Response(JSON.stringify(session), {
      status: url.includes("/v1/checkout-sessions/") ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
}

test("Bachs retries bind a distinct idempotency key and credential version to each attempt", async () => {
  process.env.STORE_ID = "shopbeta";
  process.env.NEXT_PUBLIC_STORE_ID = "shopbeta";
  process.env.NEXT_PUBLIC_APP_URL = "https://www.shopbetaa.store";
  const f = fixture();
  f.records.set("orders/order-1", {
    ...f.records.get("orders/order-1"),
    storeId: "shopbeta",
    storeName: "ShopBeta",
  });
  const context = f.load("@/lib/server/store-context");
  const initialize = f.load("@/lib/server/bachs-payment-service").initializeBachsForOrder;
  const keys = [];
  await withFetch(async (url, init) => {
    assert.equal(url, "https://api.bachs.io/v1/checkout-sessions");
    const body = JSON.parse(init.body);
    keys.push(init.headers["Idempotency-Key"]);
    assert.equal(keys.at(-1), `checkout-order-1-${body.reference}`);
    assert.equal(body.pricing.amount, "100.00");
    assert.equal(body.pricing.currency, "NGN");
    assert.equal(new URL(body.success_url).origin, "https://www.shopbetaa.store");
    return new Response(JSON.stringify({
      checkout_id: `checkout-${keys.length}`,
      checkout_url: "https://checkout.bachs.io/c/test",
      status: "open",
      reference: body.reference,
    }), { status: 200 });
  }, async () => {
    for (const version of ["account-before-rotation", "account-after-rotation"]) {
      if (version === "account-after-rotation")
        delete f.records.get("orders/order-1").storeName;
      const result = await context.withStoreContext(
        { id: "shopbeta", storeName: "ShopBeta Renamed", credentialVersion: version },
        () => initialize("order-1"),
      );
      assert.equal(result.ok, true);
      const attempt = [...f.records.values()].find((p) => p.reference === result.reference && p.gateway === "bachs");
      assert.equal(attempt.storeId, "shopbeta");
      assert.equal(attempt.storeName, version === "account-before-rotation" ? "ShopBeta" : "ShopBeta Renamed");
      assert.equal(attempt.credentialVersion, version);
    }
  });
  assert.notEqual(keys[0], keys[1]);
});

test("Bachs upstream diagnostics retain HTTP status without logging response text or credentials", async () => {
  const messages = [];
  const original = console.error;
  console.error = (...args) => messages.push(args.join(" "));
  try {
    const get = loader()("@/lib/server/bachs").getBachsCheckoutSession;
    await withFetch(async () => new Response(JSON.stringify({ detail: "never-log@example.com whsec_private", error_code: "sk_live_private" }), { status: 403 }), async () => {
      await assert.rejects(get({ sandbox: false, apiKey: "sk_live_fixture", webhookSecret: "unused" }, "chk_fixture"));
    });
    assert.match(messages.join(""), /"status":403/);
    assert.doesNotMatch(messages.join(""), /never-log|whsec_private|sk_live_private|sk_live_fixture/);
  } finally { console.error = original; }
});

for (const [label, result, status] of [
  ["pending", { ok: false, status: "processing", reason: "Payment is still processing." }, 200],
  ["failed", { ok: false, status: "failed", reason: "Payment was not successful." }, 200],
  ["mismatch", { ok: false, reason: "Payment amount, currency or checkout identity does not match." }, 409],
  ["success", { ok: true }, 200],
  ["upstream failure", null, 502],
]) {
  test(`Bachs webhook returns an explicit status for ${label}`, async () => {
    const load = loader({
      "@/lib/server/bachs-settings": { getBachsWebhookSecrets: async () => [SECRET] },
      "@/lib/server/store-context": { currentStoreContext: () => ({ id: "shopbeta", credentialVersion: "v1" }) },
      "@/lib/server/bachs-payment-service": { verifyBachsForReference: async () => { if (!result) throw Error("upstream"); return result; } },
    });
    const body = JSON.stringify({ type: "checkout.completed", data: { reference: "BA" + "a".repeat(32) } });
    const ts = String(Math.floor(Date.now() / 1000));
    const response = await load("@/app/api/payments/bachs/webhook/route").POST(new Request("https://example.test/api/payments/bachs/webhook", {
      method: "POST", body, headers: { "x-bachs-signature-v2": `t=${ts},v1=${sign(SECRET, ts, body)}` },
    }));
    assert.equal(response.status, status);
    assert.match(response.headers.get("content-type"), /application\/json/);
  });
}

test("Bachs production verifier rejects sandbox records before fetching or changing production data", async () => {
  const f = fixture();
  f.records.get("payments/pay-1").metadata.sandbox = true;
  await withFetch(() => { throw new Error("Network must not be called"); }, async () => {
    const result = await f.load("@/lib/server/bachs-payment-service").verifyBachsForReference(f.reference);
    assert.equal(result.ok, false);
    assert.match(result.reason, /isolated registry/);
  });
  assert.equal(f.records.get("orders/order-1").paymentStatus, "processing");
  assert.equal(f.records.get("products/product-1").stock, 8);
  assert.equal(f.notifications(), 0);
});

test("Bachs verification accepts documented top-level amount and currency", async () => {
  const f = fixture();
  const session = { ...f.session("completed"), amount: "100.00", currency: "NGN" };
  delete session.pricing;
  await withFetch(sessionResponse(session), async () => {
    assert.equal((await f.load("@/lib/server/bachs-payment-service").verifyBachsForReference(f.reference)).ok, true);
  });
});

test("bachs verify marks the order paid once the session is completed", async () => {
  const f = fixture();
  const verify = f.load(
    "@/lib/server/bachs-payment-service",
  ).verifyBachsForReference;
  await withFetch(sessionResponse(f.session("completed")), async () => {
    const result = await verify(f.reference, "evt_1");
    assert.equal(result.ok, true);
    assert.equal(result.order.paymentStatus, "paid");
  });
  assert.equal(f.records.get("orders/order-1").paymentStatus, "paid");
  assert.equal(f.records.get("orders/order-1").inventoryReserved, true);
  assert.equal(f.records.get("products/product-1").stock, 7);
  assert.equal(f.records.get("payments/pay-1").status, "paid");
  assert.equal(f.notifications(), 1);
});

test("bachs verify is idempotent across retries and duplicate events", async () => {
  const f = fixture();
  const verify = f.load(
    "@/lib/server/bachs-payment-service",
  ).verifyBachsForReference;
  await withFetch(sessionResponse(f.session("completed")), async () => {
    assert.equal((await verify(f.reference, "evt_1")).ok, true);
    const again = await verify(f.reference, "evt_1");
    assert.equal(again.ok, true);
    assert.equal(again.alreadyProcessed, true);
  });
  assert.equal(f.records.get("products/product-1").stock, 7);
  assert.equal(f.notifications(), 1);
});

test("bachs open/expired sessions never mark the order paid", async () => {
  const f = fixture();
  const verify = f.load(
    "@/lib/server/bachs-payment-service",
  ).verifyBachsForReference;
  await withFetch(sessionResponse(f.session("open")), async () => {
    const result = await verify(f.reference);
    assert.equal(result.ok, false);
    assert.equal(result.status, "processing");
  });
  assert.equal(f.records.get("orders/order-1").paymentStatus, "processing");
  assert.equal(f.records.get("products/product-1").stock, 8);

  await withFetch(sessionResponse(f.session("expired")), async () => {
    const result = await verify(f.reference);
    assert.equal(result.ok, false);
  });
  assert.equal(f.records.get("orders/order-1").paymentStatus, "failed");
});

test("bachs verify rejects a session reference mismatch", async () => {
  const f = fixture();
  const verify = f.load(
    "@/lib/server/bachs-payment-service",
  ).verifyBachsForReference;
  await withFetch(
    sessionResponse({
      ...f.session("completed"),
      reference: "BA" + "b".repeat(32),
    }),
    async () => {
      const result = await verify(f.reference);
      assert.equal(result.ok, false);
    },
  );
  assert.equal(f.records.get("orders/order-1").paymentStatus, "processing");
});

test("bachs COD commitment fee keeps paymentStatus pending", async () => {
  const f = fixture({ purpose: "cod_commitment_fee" });
  const verify = f.load(
    "@/lib/server/bachs-payment-service",
  ).verifyBachsForReference;
  await withFetch(sessionResponse(f.session("completed")), async () => {
    const result = await verify(f.reference, "evt_2");
    assert.equal(result.ok, true);
  });
  const order = f.records.get("orders/order-1");
  assert.equal(order.commitmentFeeStatus, "paid");
  assert.equal(order.paymentStatus, "pending");
  assert.equal(order.codAmountPaid, 25);
  assert.equal(order.codBalance, 75);
  assert.equal(f.records.get("products/product-1").stock, 7);
});

test("bachs verify rejects payments from another gateway", async () => {
  const f = fixture();
  f.records.set("payments/pay-1", {
    ...f.records.get("payments/pay-1"),
    gateway: "squad",
  });
  const verify = f.load(
    "@/lib/server/bachs-payment-service",
  ).verifyBachsForReference;
  const result = await verify(f.reference);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "Bachs payment not found.");
});

test("bachs authoritative amount and currency mismatches cannot consume stock", async () => {
  for (const pricing of [
    { amount: "1.00", currency: "NGN" },
    { amount: "100.00", currency: "USD" },
  ]) {
    const f = fixture();
    await withFetch(
      sessionResponse({ ...f.session("completed"), pricing }),
      async () => {
        const result = await f
          .load("@/lib/server/bachs-payment-service")
          .verifyBachsForReference(f.reference);
        assert.equal(result.ok, false);
      },
    );
    assert.equal(f.records.get("products/product-1").stock, 8);
    assert.equal(f.records.get("orders/order-1").paymentStatus, "processing");
  }
});
