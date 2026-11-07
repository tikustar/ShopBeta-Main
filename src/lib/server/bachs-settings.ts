import {
  deploymentEnv,
  providerSecrets,
  storeSettingsRef,
  currentStoreContext,
  withStoreContext,
} from "@/lib/server/store-context";

/**
 * Bachs credentials live in the write-only `privatePaymentSettings/bachs`
 * document, with environment-variable fallbacks — same pattern as Squad.
 * Sandbox and live keys/webhook signing secrets are stored separately.
 */
export async function getBachsConfiguration(sandboxOverride?: boolean) {
  const [settings, secrets] = await Promise.all([
    storeSettingsRef().get(),
    providerSecrets("bachs").then((data) => ({ data: () => data })),
  ]);
  const payments = settings.data()?.payments;
  const sandbox =
    sandboxOverride ??
    payments?.bachsSandbox ??
    deploymentEnv("BACHS_SANDBOX") !== "false";
  const data = secrets.data() ?? {};
  const apiKey: string =
    (sandbox ? data.sandboxApiKey : data.liveApiKey) ||
    (sandbox
      ? deploymentEnv("BACHS_SANDBOX_API_KEY")
      : deploymentEnv("BACHS_LIVE_API_KEY")) ||
    "";
  const webhookSecret: string =
    (sandbox ? data.sandboxWebhookSecret : data.liveWebhookSecret) ||
    (sandbox
      ? deploymentEnv("BACHS_SANDBOX_WEBHOOK_SECRET")
      : deploymentEnv("BACHS_LIVE_WEBHOOK_SECRET")) ||
    "";
  return {
    enabled:
      payments?.bachsEnabled ??
      deploymentEnv("NEXT_PUBLIC_BACHS_ENABLED") === "true",
    sandbox: Boolean(sandbox),
    apiKey: apiKey.trim(),
    webhookSecret: webhookSecret.trim(),
  };
}

/** Signing secrets for both environments — webhooks accept either. */
export async function getBachsWebhookSecrets() {
  const secrets = (
    await providerSecrets("bachs").then((data) => ({ data: () => data }))
  ).data();
  const context = currentStoreContext();
  const candidates = [
    secrets?.sandboxWebhookSecret,
    secrets?.liveWebhookSecret,
    deploymentEnv("BACHS_SANDBOX_WEBHOOK_SECRET"),
    deploymentEnv("BACHS_LIVE_WEBHOOK_SECRET"),
  ];
  if (context.credentialVersion) {
    await withStoreContext({ id: context.id }, async () => {
      const current = await providerSecrets("bachs");
      for (const environment of ["sandbox", "live"] as const) {
        const key = `${environment}ApiKey`;
        const signing = `${environment}WebhookSecret`;
        const prefix = environment.toUpperCase();
        const apiKey = current[key] || deploymentEnv(`BACHS_${prefix}_API_KEY`);
        if (!secrets?.[signing] && typeof secrets?.[key] === "string" &&
          secrets[key].trim() && typeof apiKey === "string" &&
          secrets[key].trim() === apiKey.trim()) {
          candidates.push(current[signing] || deploymentEnv(`BACHS_${prefix}_WEBHOOK_SECRET`));
          console.info(JSON.stringify({ bachs: { stage: "credentials", environment, snapshotRecovery: "matching_account" } }));
        } else if (!secrets?.[signing] && secrets?.[key]) {
          console.info(JSON.stringify({ bachs: { stage: "credentials", environment, snapshotRecovery: "account_mismatch_or_unavailable" } }));
        }
      }
    });
  }
  return candidates.filter((v): v is string => typeof v === "string" && Boolean(v.trim()));
}
