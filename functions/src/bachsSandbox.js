const { createHmac, timingSafeEqual, createHash } = require("node:crypto");

const ROOT = "privateBachsSandbox";
const BASE = "https://sandbox-api.bachs.io";
const EVENTS = new Set(["collection.succeeded", "collection.failed", "checkout.completed", "checkout.expired"]);
const fingerprint = (key) => createHash("sha256").update(key).digest("hex");

function signatureValid(raw, headers, secret, now = Date.now()) {
  if (typeof secret !== "string" || !secret.trim()) return false;
  let timestamp = String(headers["x-bachs-timestamp"] || "").trim();
  const signatures = [];
  for (const part of String(headers["x-bachs-signature-v2"] || "").split(",")) {
    const [key, value] = part.trim().split("=", 2);
    if (key === "t" && value) timestamp = value.trim();
    if (key === "v1" && value) signatures.push(value.trim());
  }
  if (headers["x-bachs-signature"]) signatures.push(String(headers["x-bachs-signature"]).trim());
  if (!/^\d+$/.test(timestamp) || Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret.trim()).update(`${timestamp}.`).update(raw).digest();
  return signatures.some((value) => /^[a-f0-9]{64}$/i.test(value) && timingSafeEqual(expected, Buffer.from(value, "hex")));
}

function createSandboxHandler({ getDb, fetchImpl = fetch, timestamp, log = () => {} }) {
  return async function sandbox(req, res) {
    if (req.method !== "POST") return false;
    const raw = Buffer.isBuffer(req.rawBody) ? req.rawBody : typeof req.rawBody === "string" ? Buffer.from(req.rawBody) : null;
    if (!raw) return false;
    let event;
    try { event = JSON.parse(raw.toString("utf8")); } catch { return false; }
    const reference = event?.data?.reference;
    const validReference = typeof reference === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(reference);
    const diagnosticReference = typeof reference === "string" && /^SBX[a-f0-9]{32}$/.test(reference) ? reference : "nonstandard";
    const db = getDb();
    const root = db.collection(ROOT).doc("registry");
    const config = (await db.collection(ROOT).doc("config").get()).data() || {};
    const paymentRef = validReference ? root.collection("payments").doc(reference) : null;
    const saved = paymentRef ? await paymentRef.get() : null;
    const authenticated = signatureValid(raw, req.headers, config.webhookSecret);
    if (!authenticated && !saved?.exists) return false;
    const reply = (status, reason, extra = {}) => {
      log("sandbox.result", { environment: "sandbox", reference: diagnosticReference, status, reason });
      res.status(status).json({ ok: status === 200, environment: "sandbox", reason, ...extra });
      return true;
    };
    if (!authenticated) return reply(401, "sandbox_signature_invalid");
    if (config.enabled !== true || typeof config.apiKey !== "string" || !config.apiKey.startsWith("sk_sandbox_") || !config.webhookSecret) return reply(503, "sandbox_configuration_unavailable");
    if (!EVENTS.has(event.type)) return reply(200, "ignored");
    if (!saved?.exists) return reply(404, "sandbox_payment_not_found");
    const payment = saved.data();
    const account = fingerprint(config.apiKey);
    if (payment.environment !== "sandbox" || payment.storeId !== "shopbeta" || payment.reference !== reference || payment.accountFingerprint !== account || !/^chk_[A-Za-z0-9_-]+$/.test(payment.checkoutId || "") || payment.orderId !== reference || payment.inventoryId !== reference || payment.currency !== "NGN" || !Number.isSafeInteger(payment.amountMinor) || payment.amountMinor <= 0 || !Number.isSafeInteger(payment.quantity) || payment.quantity <= 0) return reply(409, "sandbox_registry_mismatch");
    if (event.data.checkout_id && event.data.checkout_id !== payment.checkoutId) return reply(409, "sandbox_checkout_mismatch");
    let response, session;
    try {
      response = await fetchImpl(`${BASE}/v1/checkout-sessions/${encodeURIComponent(payment.checkoutId)}`, {
        headers: { Authorization: `Bearer ${config.apiKey}`, Accept: "application/json" },
        redirect: "error", signal: AbortSignal.timeout(8000),
      });
      session = await response.json().catch(() => null);
    } catch {
      return reply(502, "sandbox_upstream_transport_error");
    }
    if (!response.ok || !session) {
      log("sandbox.upstream", { environment: "sandbox", reference: diagnosticReference, status: response.status, errorCodePresent: typeof session?.error_code === "string", hasDetail: typeof session?.detail === "string" });
      return reply(502, "sandbox_verification_unavailable");
    }
    const amount = Number(session.amount ?? session.pricing?.amount);
    const currency = session.currency ?? session.pricing?.currency;
    if (session.checkout_id !== payment.checkoutId || session.reference !== reference || session.metadata?.sandboxRun !== reference || !Number.isFinite(amount) || Math.round(amount * 100) !== payment.amountMinor || currency !== payment.currency || (session.account_id && session.account_id !== config.accountId)) return reply(409, "sandbox_verification_mismatch");
    if (session.status !== "completed" || session.payment_status !== "succeeded" || (session.charge && session.charge.status !== "succeeded")) return reply(200, "sandbox_not_paid", { paymentStatus: session.payment_status || "unknown" });
    const orderRef = root.collection("orders").doc(reference);
    const inventoryRef = root.collection("inventory").doc(reference);
    const notificationRef = root.collection("notifications").doc(reference);
    const result = await db.runTransaction(async (tx) => {
      const [latest, order, inventory, notification] = await Promise.all([tx.get(paymentRef), tx.get(orderRef), tx.get(inventoryRef), tx.get(notificationRef)]);
      const p = latest.data(), o = order.data(), i = inventory.data();
      if (!p || p.accountFingerprint !== account || p.checkoutId !== payment.checkoutId || p.amountMinor !== payment.amountMinor || p.quantity !== payment.quantity || p.environment !== "sandbox" || p.orderId !== reference || p.inventoryId !== reference || p.reference !== reference || p.currency !== payment.currency || !o || o.environment !== "sandbox" || o.reference !== reference || o.totalMinor !== p.amountMinor || !i || i.environment !== "sandbox") return { status: 409, reason: "sandbox_fixture_mismatch" };
      if (p.status === "paid") return notification.exists && o.paymentStatus === "paid" ? { status: 200, reason: "already_processed" } : { status: 409, reason: "sandbox_state_inconsistent" };
      if (notification.exists || !Number.isSafeInteger(i.stock) || i.stock < p.quantity) return { status: 409, reason: "sandbox_inventory_or_notification_conflict" };
      const at = timestamp();
      tx.update(paymentRef, { status: "paid", updatedAt: at });
      tx.update(orderRef, { paymentStatus: "paid", orderStatus: "processing", updatedAt: at });
      tx.update(inventoryRef, { stock: i.stock - p.quantity });
      tx.set(notificationRef, { environment: "sandbox", recordedAt: at, payload: {
        customerName: "Sandbox Test", customerEmail: "sandbox@example.invalid", phoneNumber: "", orderId: reference,
        orderDate: o.orderDate, expectedDelivery: "Sandbox only", shippingAddress: "Sandbox only", subtotal: p.amountMinor / 100,
        products: [{ productName: "Isolated sandbox item", quantity: p.quantity, price: p.amountMinor / 100 / p.quantity, subtotal: p.amountMinor / 100 }],
        deliveryFee: 0, discount: 0, totalPrice: p.amountMinor / 100, paymentStatus: "paid", paymentMethod: "bachs", reference, orderStatus: "processing",
      } });
      return { status: 200, reason: "sandbox_paid" };
    });
    return reply(result.status, result.reason);
  };
}

module.exports = { createSandboxHandler, signatureValid, fingerprint, ROOT };
