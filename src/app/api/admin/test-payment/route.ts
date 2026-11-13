import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/admin/rbac";
import { getAppUrl } from "@/lib/server/env";
import { getAdminDb } from "@/lib/server/firebase-admin";
import {
  clientKeyFromRequest,
  rateLimit,
} from "@/lib/server/rate-limit";
import { requestIdentity } from "@/lib/server/request-auth";
import { withStoreContext } from "@/lib/server/store-context";
import { getBachsConfiguration } from "@/lib/server/bachs-settings";
import { createBachsCheckoutSession } from "@/lib/server/bachs";
import { getMonnifyConfiguration } from "@/lib/server/monnify-settings";
import { initializeMonnifyTransaction } from "@/lib/server/monnify";
import { getSquadConfiguration } from "@/lib/server/squad-settings";
import { initializeSquadTransaction } from "@/lib/server/squad";
import { initializePaystackTransaction } from "@/lib/server/paystack";
import { initializeKorapayTransaction } from "@/lib/server/korapay";
import { deploymentStoreId } from "@/lib/store";
import { getAppSettings } from "@/services/settings.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TestProvider =
  | "paystack"
  | "korapay"
  | "flutterwave"
  | "squad"
  | "monnify"
  | "bachs"
  | "cod";

const PROVIDERS: TestProvider[] = [
  "paystack",
  "korapay",
  "flutterwave",
  "squad",
  "monnify",
  "bachs",
  "cod",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TestResult = {
  ok: boolean;
  provider: string;
  environment: "test" | "live";
  email: string;
  amount: number;
  currency: string;
  status?: string;
  reference?: string;
  checkoutUrl?: string;
  error?: string;
  requiresConfirmation?: boolean;
};

/**
 * Resolve the environment the provider is currently configured to run in.
 * Squad/Monnify/Bachs carry their own sandbox flag inside their private
 * configuration; Paystack/KoraPay/Flutterwave use the public settings flag.
 */
async function providerEnvironment(
  provider: TestProvider,
  payments: Record<string, unknown> | undefined,
): Promise<{ environment: "test" | "live"; config?: unknown }> {
  switch (provider) {
    case "squad": {
      const config = await getSquadConfiguration();
      return { environment: config.sandbox ? "test" : "live", config };
    }
    case "monnify": {
      const config = await getMonnifyConfiguration();
      return { environment: config.sandbox ? "test" : "live", config };
    }
    case "bachs": {
      const config = await getBachsConfiguration();
      return { environment: config.sandbox ? "test" : "live", config };
    }
    case "paystack":
    case "korapay":
    case "flutterwave":
      return {
        environment: payments?.[`${provider}Sandbox`] === true ? "test" : "live",
      };
    default:
      return { environment: "live" };
  }
}

/**
 * Admin-only payment integration test. Initializes a transaction directly
 * against the provider's API with the configured credentials — no order,
 * payment record, inventory change, cart change or Make.com notification is
 * created. Test references are prefixed `ADMTEST-` and never resolve to a
 * stored payment, so any stray provider callback is a no-op.
 */
export async function POST(request: Request) {
  const limited = rateLimit({
    key: clientKeyFromRequest(request, "admin-test-payment"),
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.ok)
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );

  try {
    const identity = await requestIdentity(request);
    const profile = (
      await getAdminDb().collection("users").doc(identity.uid).get()
    ).data();
    if (
      profile?.status === "suspended" ||
      profile?.status === "deleted" ||
      !hasPermission(profile?.role, "settings:write")
    )
      return NextResponse.json(
        { ok: false, error: "Access denied." },
        { status: 403 },
      );

    const body = (await request.json().catch(() => null)) as {
      provider?: string;
      email?: string;
      amount?: number;
      confirmLive?: boolean;
    } | null;
    const provider = body?.provider as TestProvider | undefined;
    const email = body?.email?.trim() ?? "";
    const amount = Number(body?.amount);

    if (!provider || !PROVIDERS.includes(provider))
      return NextResponse.json(
        { ok: false, error: "Unsupported payment provider." },
        { status: 400 },
      );
    if (!EMAIL_PATTERN.test(email) || email.length > 200)
      return NextResponse.json(
        { ok: false, error: "A valid customer email address is required." },
        { status: 400 },
      );
    if (!Number.isFinite(amount) || amount < 1 || amount > 10_000_000)
      return NextResponse.json(
        {
          ok: false,
          error: "Test amount must be between ₦1 and ₦10,000,000.",
        },
        { status: 400 },
      );

    return await withStoreContext(
      { id: deploymentStoreId() },
      async () => {
        const settings = await getAppSettings();
        const { environment, config } = await providerEnvironment(
          provider,
          settings?.payments as Record<string, unknown> | undefined,
        );

        if (provider === "cod")
          return NextResponse.json({
            ok: false,
            provider,
            environment,
            email,
            amount,
            currency: "NGN",
            error:
              "Cash on Delivery has no online payment to initialize — it is confirmed on delivery, so there is nothing to test.",
          } satisfies TestResult);

        if (provider === "flutterwave")
          return NextResponse.json({
            ok: false,
            provider,
            environment,
            email,
            amount,
            currency: "NGN",
            error:
              "Flutterwave initialization is not implemented yet, so an automated test cannot run.",
          } satisfies TestResult);

        if (environment === "live" && body?.confirmLive !== true)
          return NextResponse.json({
            ok: false,
            provider,
            environment,
            email,
            amount,
            currency: "NGN",
            requiresConfirmation: true,
            error:
              "This provider is configured in live mode. Confirm to initialize a real transaction.",
          } satisfies TestResult);

        const reference = `ADMTEST-${provider.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
        const returnUrl = `${getAppUrl()}/admin/integrations`;
        const metadata = {
          integrationTest: true,
          testPayment: true,
          customerName: "Integration Test",
        };

        try {
          let checkoutUrl: string | undefined;
          switch (provider) {
            case "paystack": {
              const result = await initializePaystackTransaction({
                email,
                amountNaira: amount,
                reference,
                callbackUrl: returnUrl,
                metadata,
              });
              checkoutUrl = result.authorization_url;
              break;
            }
            case "korapay": {
              const result = await initializeKorapayTransaction({
                email,
                amountNaira: amount,
                reference,
                redirectUrl: returnUrl,
                metadata,
              });
              checkoutUrl = result.checkout_url;
              break;
            }
            case "squad": {
              const result = await initializeSquadTransaction(
                config as Awaited<
                  ReturnType<typeof getSquadConfiguration>
                >,
                {
                  email,
                  customerName: "Integration Test",
                  amount,
                  reference,
                  callbackUrl: returnUrl,
                  metadata,
                },
              );
              checkoutUrl = result.authorizationUrl;
              break;
            }
            case "monnify": {
              const result = await initializeMonnifyTransaction(
                config as Awaited<
                  ReturnType<typeof getMonnifyConfiguration>
                >,
                {
                  email,
                  customerName: "Integration Test",
                  amount,
                  reference,
                  callbackUrl: returnUrl,
                  metadata,
                },
              );
              checkoutUrl = result.authorizationUrl;
              break;
            }
            case "bachs": {
              const result = await createBachsCheckoutSession(
                config as Awaited<
                  ReturnType<typeof getBachsConfiguration>
                >,
                {
                  email,
                  customerName: "Integration Test",
                  amount: amount.toFixed(2),
                  currency: "NGN",
                  reference,
                  successUrl: returnUrl,
                  cancelUrl: returnUrl,
                  metadata,
                  idempotencyKey: reference,
                },
              );
              checkoutUrl = result.checkoutUrl;
              break;
            }
          }

          return NextResponse.json({
            ok: true,
            provider,
            environment,
            email,
            amount,
            currency: "NGN",
            status: "initialized",
            reference,
            checkoutUrl,
          } satisfies TestResult);
        } catch (error) {
          return NextResponse.json({
            ok: false,
            provider,
            environment,
            email,
            amount,
            currency: "NGN",
            error:
              error instanceof Error
                ? error.message
                : "Payment initialization failed.",
          } satisfies TestResult);
        }
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        error:
          message === "Authentication required."
            ? "Authentication required."
            : "The test payment could not be processed.",
      },
      { status: message === "Authentication required." ? 401 : 500 },
    );
  }
}
