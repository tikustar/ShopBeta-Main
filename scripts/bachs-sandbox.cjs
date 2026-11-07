const fs = require("node:fs");
const path = require("node:path");
const { randomUUID, createHmac } = require("node:crypto");
const { fingerprint } = require("../functions/src/bachsSandbox");
const PROJECT = "shop-day84j";
const ROOT = `projects/${PROJECT}/databases/(default)/documents/privateBachsSandbox`;
const WEBHOOK = "https://us-central1-shop-day84j.cloudfunctions.net/bachsWebhook";
const BASE = "https://sandbox-api.bachs.io";

function fields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key,
    typeof v === "boolean" ? { booleanValue: v } : typeof v === "number" ? { integerValue: String(v) } : { stringValue: v },
  ]));
}

async function main() {
  const mode = process.argv[2];
  if (!["inspect", "configure", "initialize", "status", "probe", "events", "replay"].includes(mode)) throw Error("Use inspect, configure, initialize, probe, status, events or replay [reference].");
  const raw = fs.readFileSync(path.join(__dirname, "../bachs test credentials"), "utf8");
  const apiKey = raw.match(/sk_sandbox_[A-Za-z0-9_-]+/)?.[0];
  const webhookSecret = raw.match(/whsec_[A-Za-z0-9_-]+/)?.[0];
  if (!apiKey || !webhookSecret || /sk_live_/.test(raw)) throw Error("Sandbox-only credentials required.");
  const tools = path.join(process.env.APPDATA || "", "npm/node_modules/firebase-tools/lib");
  const auth = require(path.join(tools, "auth"));
  const account = auth.getProjectDefaultAccount(path.join(__dirname, "..")) || auth.getGlobalDefaultAccount();
  if (account?.user?.email !== "tikustarflow@gmail.com") throw Error("Verified Owner identity required.");
  await require(path.join(tools, "requireAuth")).requireAuth({ project: PROJECT, user: account.user, tokens: account.tokens });
  const { Client } = require(path.join(tools, "apiv2"));
  const db = new Client({ urlPrefix: "https://firestore.googleapis.com", apiVersion: "v1", auth: true });
  const sandboxRequest = async (route, init = {}) => {
    const response = await fetch(BASE + route, { ...init, redirect: "error", signal: AbortSignal.timeout(15000), headers: {
      Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...init.headers,
    } });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw Error(`Sandbox API HTTP ${response.status}; response suppressed.`);
    return data;
  };
  if (mode === "inspect") {
    const endpoints = await sandboxRequest("/v1/webhooks/endpoints");
    console.log(JSON.stringify({ sandboxKeyAccepted: true, endpoints: (endpoints.items || []).map(e => ({ id: e.endpoint_id, registeredUrlMatches: e.url === WEBHOOK, enabled: e.enabled, events: e.event_types })) }));
    return;
  }
  if (mode === "configure") {
    await db.patch(ROOT + "/config", { fields: fields({ enabled: true, apiKey, webhookSecret }) });
    console.log("Isolated sandbox configuration saved; live configuration untouched.");
    return;
  }
  if (mode === "status") {
    const ref = process.argv[3];
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(ref || "")) throw Error("A valid test reference is required.");
    const result = {};
    for (const collection of ["payments", "orders", "inventory", "notifications"]) {
      try {
        const r = await db.get(`${ROOT}/registry/${collection}/${ref}`);
        const f = r.body.fields || {};
        result[collection] = { exists: true, status: f.status?.stringValue || f.paymentStatus?.stringValue, stock: f.stock?.integerValue, environment: f.environment?.stringValue };
      } catch { result[collection] = { exists: false }; }
    }
    console.log(JSON.stringify(result));
    return;
  }
  const config = await db.get(ROOT + "/config");
  if (config.body.fields?.enabled?.booleanValue !== true || config.body.fields?.apiKey?.stringValue !== apiKey || config.body.fields?.webhookSecret?.stringValue !== webhookSecret) throw Error("Isolated configuration does not match supplied sandbox credentials.");
  if (mode === "probe" || mode === "initialize") {
    const raw = JSON.stringify({ type: "collection.succeeded", data: { reference: "SBX" + randomUUID().replaceAll("-", ""), checkout_id: "chk_probe" } });
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = createHmac("sha256", webhookSecret).update(`${ts}.${raw}`).digest("hex");
    const r = await fetch(WEBHOOK, { method: "POST", redirect: "error", signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", "x-bachs-signature-v2": `t=${ts},v1=${signature}` }, body: raw });
    const result = await r.json().catch(() => ({}));
    if (r.status !== 404 || result.environment !== "sandbox" || result.reason !== "sandbox_payment_not_found") throw Error("Isolated configuration probe failed; transactions blocked.");
    console.log("Sandbox signature accepted and unknown sandbox reference rejected without production processing.");
    if (mode === "probe") return;
  }
  if (mode === "events" || mode === "replay") {
    const ref = process.argv[3];
    if (!/^SBX[a-f0-9]{32}$/.test(ref || "")) throw Error("A valid test reference is required.");
    const p = (await db.get(`${ROOT}/registry/payments/${ref}`)).body.fields || {};
    if (p.environment?.stringValue !== "sandbox" || p.reference?.stringValue !== ref || p.accountFingerprint?.stringValue !== fingerprint(apiKey)) throw Error("Isolated configuration registry mismatch.");
    const endpoints = await sandboxRequest("/v1/webhooks/endpoints");
    const endpoint = endpoints.items?.find(e => e.url === WEBHOOK && e.enabled);
    if (!endpoint) throw Error("Isolated configuration endpoint unavailable.");
    const route = `/v1/webhooks/endpoints/${encodeURIComponent(endpoint.endpoint_id)}/events`;
    const events = await sandboxRequest(route + "?limit=100");
    const matches = (events.items || []).filter(e => e.entity_id === p.checkoutId?.stringValue && e.event_type === "checkout.completed");
    if (mode === "replay") {
      if (p.status?.stringValue !== "paid" || matches.length !== 1) throw Error("Isolated configuration paid test event required before replay.");
      await sandboxRequest(route + `/${encodeURIComponent(matches[0].event_id)}/resend`, { method: "POST", headers: { "Idempotency-Key": "replay-" + randomUUID() }, body: "{}" });
      console.log("Requested Bachs redelivery of the isolated sandbox checkout event only.");
    } else console.log(JSON.stringify(matches.map(e => ({ eventId: e.event_id, status: e.last_attempt_http_status, attempts: e.attempts, succeeded: e.success, failed: e.failed }))));
    return;
  }
  const reference = "SBX" + randomUUID().replaceAll("-", "");
  const session = await sandboxRequest("/v1/checkout-sessions", { method: "POST", headers: { "Idempotency-Key": reference }, body: JSON.stringify({
    pricing: { currency: "NGN", amount: "100.00", price_type: "fixed" },
    customer: { email: "sandbox@example.com", name: "Isolated Sandbox Test" },
    reference, metadata: { sandboxRun: reference },
    success_url: "https://www.zenvexacommerce.com", cancel_url: "https://www.zenvexacommerce.com",
  }) });
  if (!/^chk_[A-Za-z0-9_-]+$/.test(session.checkout_id || "")) throw Error("Invalid sandbox checkout identity.");
  const url = new URL(session.checkout_url);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".bachs.io")) throw Error("Unexpected sandbox checkout host.");
  const writes = {
    payments: { environment: "sandbox", storeId: "shopbeta", reference, accountFingerprint: fingerprint(apiKey), checkoutId: session.checkout_id, orderId: reference, inventoryId: reference, amountMinor: 10000, currency: "NGN", quantity: 1, status: "processing" },
    orders: { environment: "sandbox", reference, totalMinor: 10000, paymentStatus: "processing", orderDate: new Date().toISOString() },
    inventory: { environment: "sandbox", stock: 5 },
  };
  for (const [collection, value] of Object.entries(writes)) await db.patch(`${ROOT}/registry/${collection}/${reference}`, { fields: fields(value) });
  console.log(JSON.stringify({ reference, checkoutId: session.checkout_id, checkoutUrl: url.toString(), environment: "sandbox", initialIsolatedStock: 5 }));
}

main().catch(error => {
  const safe = error instanceof Error && /^(Use |Sandbox-only|Verified Owner|Sandbox API HTTP|A valid test|Isolated configuration|Invalid sandbox|Unexpected sandbox)/.test(error.message);
  console.error(safe ? error.message : "Sandbox operation failed; raw error suppressed to protect credentials.");
  process.exitCode = 1;
});
