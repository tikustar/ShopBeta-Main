import { verifyBachsWebhookSignature } from "@/lib/server/bachs";
import { verifyBachsForReference } from "@/lib/server/bachs-payment-service";
import { getBachsWebhookSecrets } from "@/lib/server/bachs-settings";
import { currentStoreContext } from "@/lib/server/store-context";
import { withStoreRequest } from "@/lib/server/store-request";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return withStoreRequest(
    request,
    async () => {
      const raw = await request.text();
      let event;
      try { event = JSON.parse(raw); } catch {
        return NextResponse.json({ ok: false, reason: "Invalid JSON." }, { status: 400 });
      }
      const reference = event?.data?.reference;
      const diagnosticReference = typeof reference === "string" && /^BA[a-f0-9]{32}$/.test(reference) ? reference : "nonstandard";
      let secrets: string[];
      try { secrets = await getBachsWebhookSecrets(); } catch {
        console.error(JSON.stringify({ bachs: { stage: "credentials", reference: diagnosticReference, result: "snapshot_unavailable" } }));
        return NextResponse.json({ ok: false, reason: "Bachs signing configuration unavailable." }, { status: 503 });
      }
      const valid = verifyBachsWebhookSignature(
        raw,
        {
          signature: request.headers.get("x-bachs-signature"),
          signatureV2: request.headers.get("x-bachs-signature-v2"),
          timestamp: request.headers.get("x-bachs-timestamp"),
        },
        secrets,
      );
      console.info(JSON.stringify({ bachs: { stage: "signature", reference: diagnosticReference, valid, configured: secrets.length > 0, credentialSnapshot: !!currentStoreContext().credentialVersion } }));
      if (!valid)
        return NextResponse.json(
          { ok: false, reason: "Invalid signature." },
          { status: 401 },
        );
      if (
        ![
          "collection.succeeded",
          "collection.failed",
          "checkout.completed",
          "checkout.expired",
        ].includes(event.type)
      )
        return NextResponse.json({ ok: true, ignored: true });
      if (typeof reference !== "string" || !/^BA[a-f0-9]{32}$/.test(reference))
        return NextResponse.json({ ok: false, reason: "Invalid reference." }, { status: 400 });
      // Event status never authorizes fulfillment; query the saved account's checkout session.
      try {
        const result = await verifyBachsForReference(
          reference,
          `${event.type}:${typeof event.id === "string" ? event.id.slice(0, 200) : reference}`,
        );
        const status = result.ok ? 200 : "status" in result && ["processing", "failed", "cancelled"].includes(String(result.status)) ? 200 : 409;
        console.info(JSON.stringify({ bachs: { stage: "result", reference, ok: result.ok, httpStatus: status } }));
        return NextResponse.json(result, { status });
      } catch {
        console.error(JSON.stringify({ bachs: { stage: "verification_or_finalization", reference, result: "retryable_failure" } }));
        return NextResponse.json({ ok: false, reason: "Bachs verification temporarily unavailable." }, { status: 502 });
      }
    },
    { webhook: "bachs" },
  );
}
