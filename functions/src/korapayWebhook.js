/**
 * KoraPay Webhook Cloud Function
 * Handles KoraPay payment webhook events
 */
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getKorapaySecretKey } = require("./env");
const { createHmac, timingSafeEqual } = require("crypto");

const KORAPAY_BASE = "https://api.korapay.com/merchant/api/v1";

async function korapayFetch(path) {
  const secret = getKorapaySecretKey();
  const response = await fetch(`${KORAPAY_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const body = await response.json();
  if (!response.ok || !body.status) {
    throw new Error(body.message || `KoraPay error (${response.status})`);
  }
  return body;
}

function verifyKorapayWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  const secret = getKorapaySecretKey();
  if (!secret) return false;
  
  const hash = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const expected = Buffer.from(hash, "utf8");
    const provided = Buffer.from(signature, "utf8");
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

function mapKorapayStatus(status) {
  const normalized = status.toLowerCase();
  if (normalized === "success" || normalized === "successful") return "paid";
  if (normalized === "failed" || normalized === "failure") return "failed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "refunded") return "refunded";
  if (normalized === "pending" || normalized === "processing") return "processing";
  return "pending";
}

function fromKobo(amountKobo) {
  return amountKobo / 100;
}

exports.korapayWebhook = onRequest(async (req, res) => {
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const signature = req.headers["x-korapay-signature"];

  if (!verifyKorapayWebhookSignature(rawBody, signature)) {
    console.error("Invalid KoraPay signature");
    return res.status(401).json({ ok: false, reason: "Invalid signature" });
  }

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, reason: "Invalid JSON" });
  }

  const event = payload.event ?? "";
  const data = payload.data;

  if (!data?.reference) {
    return res.json({ ok: true, ignored: true });
  }

  const SUPPORTED = new Set(["charge.success", "charge.failed"]);
  if (!SUPPORTED.has(event)) {
    return res.json({ ok: true, ignored: true, event });
  }

  const eventId = `${event}:${data.id ?? data.reference}`;

  try {
    const db = getFirestore();
    const paymentSnap = await db
      .collection("payments")
      .where("reference", "==", data.reference)
      .limit(1)
      .get();

    const paymentDoc = paymentSnap.empty ? null : paymentSnap.docs[0];
    const paymentData = paymentDoc?.data();
    const paymentDocId = paymentDoc?.id;
    const orderId =
      (paymentData?.orderId) ||
      data.metadata?.orderId;

    if (!orderId) {
      return res.json({ ok: true, ignored: true, reason: "order_not_found" });
    }

    if (event === "charge.success") {
      let verified;
      try {
        verified = await korapayFetch(`/transactions/${data.reference}`);
      } catch (error) {
        console.error("KoraPay verify API failed:", error);
        return res.status(502).json({ ok: false, reason: "Verification failed" });
      }

      const status = mapKorapayStatus(verified.data.status);
      if (status !== "paid") {
        return res.json({ ok: true, ignored: true, reason: "not_successful" });
      }

      const orderSnap = await db.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) {
        return res.json({ ok: true, ignored: true, reason: "order_missing" });
      }

      const order = { id: orderSnap.id, ...orderSnap.data() };
      const expectedTotal = Number(order.total ?? order.totals?.total ?? 0);
      const paidAmount = fromKobo(verified.data.amount);

      if (Math.abs(expectedTotal - paidAmount) > 1) {
        console.error("Amount mismatch:", { expectedTotal, paidAmount });
        return res.json({ ok: false, reason: "Amount mismatch" });
      }

      // Check if already processed
      if (paymentDocId) {
        const processedEventIds = Array.isArray(paymentData.processedEventIds)
          ? paymentData.processedEventIds
          : [];
        if (processedEventIds.includes(eventId)) {
          return res.json({ ok: true, alreadyProcessed: true });
        }
      }

      // Update order
      await db.runTransaction(async (tx) => {
        const orderRef = db.collection("orders").doc(orderId);
        const orderDoc = await tx.get(orderRef);
        if (!orderDoc.exists) return;

        const currentPaymentStatus = orderDoc.data()?.paymentStatus;
        if (currentPaymentStatus === "paid") {
          // Already paid, just record the event
          if (paymentDocId) {
            const paymentRef = db.collection("payments").doc(paymentDocId);
            const processed = Array.isArray(paymentData.processedEventIds)
              ? [...paymentData.processedEventIds, eventId]
              : [eventId];
            tx.update(paymentRef, {
              processedEventIds: processed,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          return;
        }

        tx.update(orderRef, {
          paymentStatus: "paid",
          orderStatus: "processing",
          status: "processing",
          paymentReference: data.reference,
          paidAt: verified.data.paid_at || new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        if (paymentDocId) {
          const paymentRef = db.collection("payments").doc(paymentDocId);
          const processed = Array.isArray(paymentData.processedEventIds)
            ? [...paymentData.processedEventIds, eventId]
            : [eventId];
          tx.update(paymentRef, {
            status: "paid",
            processedEventIds: processed,
            gatewayResponse: verified.data,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });

      return res.json({
        ok: true,
        orderId,
        reference: data.reference,
      });
    }

    if (event === "charge.failed") {
      const status = mapKorapayStatus(data.status || "failed");
      await db.collection("orders").doc(orderId).update({
        paymentStatus: status === "cancelled" ? "cancelled" : "failed",
        orderStatus: status === "cancelled" ? "cancelled" : "failed",
        status: status === "cancelled" ? "cancelled" : "failed",
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.json({ ok: true });
    }

    return res.json({ ok: true, event, acknowledged: true });
  } catch (error) {
    console.error("KoraPay webhook processing failed:", error);
    return res.status(500).json({ ok: false, reason: "Webhook processing failed" });
  }
});
