process.env.NEXT_PUBLIC_STORE_ID = "shopbeta";
process.env.STORE_ID = "shopbeta";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("./payment-test-helpers.cjs");

function request(body, token = "admin-token") {
  return new Request("https://shop.test/api/admin/test-payment", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function routeWith(overrides = {}, role = "admin") {
  const calls = [];
  const base = {
    "@/lib/server/request-auth": {
      requestIdentity: async () => ({ uid: "admin-1" }),
    },
    "@/lib/server/firebase-admin": {
      getAdminDb: () => ({
        collection: () => ({
          doc: () => ({
            get: async () => ({
              data: () => ({ role, status: "active" }),
            }),
          }),
        }),
      }),
    },
    "@/lib/server/store-context": {
      withStoreContext: (_value, action) => action(),
      currentStoreId: () => "shopbeta",
      currentStoreContext: () => ({ id: "shopbeta" }),
      deploymentEnv: (name) => process.env[name],
      providerSecrets: async () => ({}),
      storeSettingsRef: () => ({
        get: async () => ({ exists: false, data: () => undefined }),
      }),
      privateProviderRef: () => ({
        get: async () => ({ exists: false, data: () => ({}) }),
      }),
      legacyCredentialsAllowed: () => false,
    },
    "@/lib/server/env": {
      getAppUrl: () => "https://shop.test",
    },
    "@/services/settings.service": {
      getAppSettings: async () => ({
        payments: {},
        storeInformation: { name: "ShopBeta" },
      }),
    },
    "@/lib/server/paystack": {
      initializePaystackTransaction: async (input) => {
        calls.push(["paystack", input]);
        return {
          authorization_url: "https://checkout.paystack.com/test",
          reference: input.reference,
        };
      },
    },
    "@/lib/server/korapay": {
      initializeKorapayTransaction: async (input) => {
        calls.push(["korapay", input]);
        return {
          checkout_url: "https://checkout.korapay.com/test",
          reference: input.reference,
        };
      },
    },
    "@/lib/server/squad-settings": {
      getSquadConfiguration: async () => ({
        enabled: true,
        sandbox: true,
        secretKey: "squad-test-key",
      }),
    },
    "@/lib/server/squad": {
      initializeSquadTransaction: async (config, input) => {
        calls.push(["squad", config.sandbox, input]);
        return {
          authorizationUrl: "https://sandbox-pay.squadco.com/test",
          reference: input.reference,
        };
      },
    },
    "@/lib/server/monnify-settings": {
      getMonnifyConfiguration: async () => ({
        enabled: true,
        sandbox: true,
        apiKey: "mk",
        secretKey: "ms",
        contractCode: "cc",
      }),
    },
    "@/lib/server/monnify": {
      initializeMonnifyTransaction: async (config, input) => {
        calls.push(["monnify", config.sandbox, input]);
        return {
          authorizationUrl: "https://sandbox.monnify.com/test",
          reference: input.reference,
        };
      },
    },
    "@/lib/server/bachs-settings": {
      getBachsConfiguration: async () => ({
        enabled: true,
        sandbox: true,
        apiKey: "sk_sandbox_x",
        webhookSecret: "whs",
      }),
    },
    "@/lib/server/bachs": {
      createBachsCheckoutSession: async (config, input) => {
        calls.push(["bachs", config.sandbox, input]);
        return {
          checkoutId: "chk_test",
          checkoutUrl: "https://sandbox-checkout.bachs.io/test",
          status: "open",
        };
      },
    },
  };
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      base[key] = { ...base[key], ...value };
    } else {
      base[key] = value;
    }
  }
  const load = loader(base);
  return {
    route: load("@/app/api/admin/test-payment/route"),
    calls,
  };
}

test("requires authentication and admin permission", async () => {
  const { route: unauthenticated } = routeWith({
    "@/lib/server/request-auth": {
      requestIdentity: async () => {
        throw new Error("Authentication required.");
      },
    },
  });
  const denied = await unauthenticated.POST(request({ provider: "paystack", email: "a@b.co", amount: 100 }));
  assert.equal(denied.status, 401);

  const { route } = routeWith({}, "staff");
  // `staff` lacks settings:write.
  const forbidden = await route.POST(
    request({ provider: "paystack", email: "a@b.co", amount: 100 }),
  );
  assert.equal(forbidden.status, 403);
});

test("validates provider, email and amount", async () => {
  const { route } = routeWith();
  assert.equal(
    (
      await route.POST(
        request({ provider: "not-a-gateway", email: "a@b.co", amount: 100 }),
      )
    ).status,
    400,
  );
  assert.equal(
    (await route.POST(request({ provider: "paystack", email: "bad", amount: 100 }))).status,
    400,
  );
  assert.equal(
    (await route.POST(request({ provider: "paystack", email: "a@b.co", amount: 0 }))).status,
    400,
  );
  assert.equal(
    (
      await route.POST(
        request({ provider: "paystack", email: "a@b.co", amount: 99_999_999 }),
      )
    ).status,
    400,
  );
});

test("paystack sandbox flag runs a test-environment initialization", async () => {
  const { route, calls } = routeWith({
    "@/services/settings.service": {
      getAppSettings: async () => ({
        payments: { paystackSandbox: true },
      }),
    },
  });
  const res = await route.POST(
    request({ provider: "paystack", email: "t@e.co", amount: 250 }),
  );
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.provider, "paystack");
  assert.equal(body.environment, "test");
  assert.equal(body.status, "initialized");
  assert.match(body.reference, /^ADMTEST-PAYSTACK-/);
  assert.equal(body.checkoutUrl, "https://checkout.paystack.com/test");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1].email, "t@e.co");
  assert.equal(calls[0][1].amountNaira, 250);
});

test("live providers require explicit confirmation before initializing", async () => {
  const { route, calls } = routeWith();
  const res = await route.POST(
    request({ provider: "paystack", email: "t@e.co", amount: 100 }),
  );
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.requiresConfirmation, true);
  assert.equal(body.environment, "live");
  assert.equal(calls.length, 0, "no provider call without confirmation");

  const confirmed = await (
    await route.POST(
      request({
        provider: "paystack",
        email: "t@e.co",
        amount: 100,
        confirmLive: true,
      }),
    )
  ).json();
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.environment, "live");
  assert.equal(calls.length, 1);
});

test("sandbox-configured providers initialize without live confirmation", async () => {
  for (const provider of ["squad", "monnify", "bachs"]) {
    const { route, calls } = routeWith();
    const body = await (
      await route.POST(request({ provider, email: "t@e.co", amount: 100 }))
    ).json();
    assert.equal(body.ok, true, provider);
    assert.equal(body.environment, "test", provider);
    assert.equal(calls.length, 1, provider);
  }
});

test("provider errors surface as failed results without throwing", async () => {
  const { route } = routeWith({
    "@/services/settings.service": {
      getAppSettings: async () => ({
        payments: { paystackSandbox: true },
      }),
    },
    "@/lib/server/paystack": {
      initializePaystackTransaction: async () => {
        throw new Error("Paystack error (401).");
      },
    },
  });
  const body = await (
    await route.POST(request({ provider: "paystack", email: "t@e.co", amount: 100 }))
  ).json();
  assert.equal(body.ok, false);
  assert.equal(body.environment, "test");
  assert.match(body.error, /Paystack error/);
});

test("COD and Flutterwave report an honest unsupported result", async () => {
  const { route, calls } = routeWith();
  const cod = await (
    await route.POST(request({ provider: "cod", email: "t@e.co", amount: 100 }))
  ).json();
  assert.equal(cod.ok, false);
  assert.match(cod.error, /no online payment/i);

  const flutterwave = await (
    await route.POST(
      request({ provider: "flutterwave", email: "t@e.co", amount: 100 }),
    )
  ).json();
  assert.equal(flutterwave.ok, false);
  assert.match(flutterwave.error, /not implemented/i);
  assert.equal(calls.length, 0);
});

test("hero pick prefers today's top seller, then all-time best, then manual fallback", () => {
  const load = loader();
  const { pickHeroProduct } = load("@/lib/hero-pick");
  const product = (id, extra = {}) => ({
    id,
    slug: id,
    active: true,
    stock: 5,
    price: 1000,
    thumbnail: "https://img.test/x.png",
    ...extra,
  });
  const today = product("today-seller");
  const allTime = product("all-time", { salesCount: 42 });
  const other = product("other", { salesCount: 7 });
  const configured = product("configured", {
    slug: "mol-syms-20000mah-100w-power-bank-with-retractable-cable",
  });
  const catalog = [configured, allTime, other, today];

  // Today's top seller wins even when another product has higher all-time sales.
  assert.equal(
    pickHeroProduct(catalog, undefined, ["missing", "today-seller"])?.id,
    "today-seller",
  );
  // An unsellable today's seller is skipped to the next ranked product.
  const inactiveToday = product("gone", { active: false });
  assert.equal(
    pickHeroProduct([...catalog, inactiveToday], undefined, [
      "gone",
      "today-seller",
    ])?.id,
    "today-seller",
  );
  // No sales today -> all-time best seller.
  assert.equal(pickHeroProduct(catalog, undefined, [])?.id, "all-time");
  // No sales at all -> manually configured product.
  const noSales = [configured, product("x"), product("y")];
  assert.equal(pickHeroProduct(noSales, undefined, [])?.id, "configured");
  // Nothing configured/sellable -> any sellable fallback.
  const fallback = product("fb");
  assert.equal(
    pickHeroProduct([product("dead", { stock: 0 })], fallback, [])?.id,
    "fb",
  );
});
