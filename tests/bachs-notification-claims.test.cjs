process.env.STORE_ID = "shopbeta";
process.env.NEXT_PUBLIC_STORE_ID = "shopbeta";
const { createRequire } = require("node:module");
const functionRequire = createRequire(require("node:path").join(__dirname, "../functions/src/finalizeShared.js"));
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loader, database } = require("./payment-test-helpers.cjs");

for (const target of ["next", "function"]) {
  for (const outcome of ["success", "timeout", "http-failure"]) {
    test(`Bachs ${target} notification claim serializes duplicates after ${outcome}`, async () => {
      const order = { id: "o", storeId: "shopbeta", paymentMethod: "bachs", paymentStatus: "paid", total: 100, products: [] };
      const { db, records } = database({ "orders/o": order });
      const run = db.runTransaction.bind(db);
      let queue = Promise.resolve();
      db.runTransaction = (action) => {
        const result = queue.then(() => run(action));
        queue = result.catch(() => undefined);
        return result;
      };
      const fields = { serverTimestamp: () => new Date(), delete: () => null };
      let notify;
      if (target === "next") {
        const load = loader({
          "@/lib/server/firebase-admin": { getAdminDb: () => db },
          "@/lib/server/env": { getAppUrl: () => "https://example.test" },
          "@/lib/server/payment-log": { paymentLog() {} },
          "@/lib/server/store-context": {
            currentStoreId: () => "shopbeta",
            privateIntegrationSettings: async () => ({ makeWebhookUrl: "https://example.test/make" }),
            deploymentEnv: () => undefined,
          },
          "firebase-admin/firestore": { FieldValue: fields },
        });
        const send = load("@/lib/server/make-webhook").notifyMakeOrderPaid;
        notify = () => send({ order, reference: "ref", bachsOnce: true });
      } else {
        const module = { exports: {} };
        new Function("require", "module", "exports", fs.readFileSync(path.join(__dirname, "../functions/src/finalizeShared.js"), "utf8"))(
          (name) => name === "firebase-admin/firestore" ? { getFirestore: () => db, FieldValue: fields } : functionRequire(name),
          module, module.exports,
        );
        notify = () => module.exports.notifyMake(order, "ref", { bachsOnce: true });
      }
      const originalFetch = global.fetch;
      const originalUrl = process.env.MAKE_WEBHOOK_URL;
      process.env.MAKE_WEBHOOK_URL = "https://example.test/make";
      let calls = 0;
      let received;
      global.fetch = async (_url, init) => {
        calls++;
        received = JSON.parse(init.body);
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (outcome === "timeout") throw new Error("ambiguous timeout");
        return new Response("{}", { status: outcome === "http-failure" ? 503 : 200 });
      };
      try {
        await Promise.all([notify(), notify(), notify()]);
        await notify();
        assert.equal(calls, 1);
        for (const key of ["customerName", "customerEmail", "phoneNumber", "orderId", "orderDate", "expectedDelivery", "shippingAddress", "subtotal", "products", "deliveryFee", "discount", "totalPrice", "paymentStatus", "paymentMethod", "reference", "orderStatus"]) {
          assert.ok(Object.hasOwn(received, key), key);
        }
        assert.equal(received.paymentMethod, "bachs");
        assert.equal(received.reference, "ref");
        assert.equal(records.get("orders/o").paymentStatus, "paid");
        assert.ok(records.has("privateStoreSettings/shopbeta/bachsMakeNotificationClaims/o"));
        assert.equal(records.get("orders/o").makeNotifyStatus, outcome === "success" ? "sent" : "failed");
      } finally {
        global.fetch = originalFetch;
        if (originalUrl === undefined) delete process.env.MAKE_WEBHOOK_URL;
        else process.env.MAKE_WEBHOOK_URL = originalUrl;
      }
    });
  }
}
