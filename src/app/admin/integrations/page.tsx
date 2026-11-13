"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { ChevronDown, FlaskConical, Loader2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { RequireAdmin } from "@/components/auth/require-admin";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label } from "@/components/ui/field";
import {
  getAppSettings,
  saveProviderSecrets,
  updateAppSettings,
} from "@/services/settings.service";
import { saveMonnifySecrets } from "@/services/monnify-settings.service";
import { saveSquadSecrets } from "@/services/squad-settings.service";
import { saveBachsSecrets } from "@/services/bachs-settings.service";
import { clearPaymentProviderSettingsCache } from "@/services/payments.service";
import { useUserStore } from "@/stores/user.store";
import { toastError, toastSuccess } from "@/stores/toast.store";
import { publicSiteUrl } from "@/lib/site-url";
import { formatPrice } from "@/lib/utils";

type ProviderKey =
  | "paystack"
  | "korapay"
  | "flutterwave"
  | "squad"
  | "monnify"
  | "bachs"
  | "cod"
  | "make";

type TestableProvider = Exclude<ProviderKey, "make">;

const PROVIDER_ORDER: ProviderKey[] = [
  "paystack",
  "korapay",
  "flutterwave",
  "squad",
  "monnify",
  "bachs",
  "cod",
  "make",
];

function ProviderPanel({
  title,
  description,
  open,
  onToggle,
  saving,
  saved,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  saving: boolean;
  saved: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-[12px] text-muted">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line px-5 py-4">
          {children}
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                `Save ${title}`
              )}
            </Button>
            {saved ? (
              <span className="text-[12px] text-emerald-600">Saved</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Nested collapsible for one credential environment inside a provider panel. */
function EnvironmentSection({
  title,
  active,
  open,
  onToggle,
  children,
}: {
  title: "Live Mode" | "Test Mode";
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-soft">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-ink">{title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              active
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-black/5 text-muted"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line px-4 py-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function WebhookUrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={url} readOnly onFocus={(e) => e.target.select()} />
      <p className="mt-1 text-[11px] text-muted">
        Register this URL in the provider&apos;s webhook settings.
      </p>
    </div>
  );
}

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

type TestDialogState = {
  provider: TestableProvider;
  providerLabel: string;
  environment: "test" | "live";
  email: string;
  amount: string;
  confirmLive: boolean;
  running: boolean;
  result?: TestResult;
};

const FUNCTIONS_BASE = "https://us-central1-shop-day84j.cloudfunctions.net";

export default function AdminIntegrationsPage() {
  const authUser = useUserStore((s) => s.authUser);
  const profile = useUserStore((s) => s.profile);
  const actor = {
    id: authUser?.uid ?? "",
    email: profile?.email ?? authUser?.email ?? undefined,
  };

  const [form, setForm] = useState({
    paystackEnabled: false,
    paystackSandbox: false,
    paystackSecretKey: "",
    paystackTestSecretKey: "",
    korapayEnabled: false,
    korapaySandbox: false,
    korapaySecretKey: "",
    korapayTestSecretKey: "",
    flutterwaveEnabled: false,
    flutterwaveSandbox: false,
    flutterwaveSecretKey: "",
    flutterwaveTestSecretKey: "",
    squadEnabled: false,
    squadSandbox: true,
    squadSandboxSecretKey: "",
    squadLiveSecretKey: "",
    monnifyEnabled: false,
    monnifySandbox: true,
    monnifySandboxApiKey: "",
    monnifySandboxSecretKey: "",
    monnifySandboxContractCode: "",
    monnifyLiveApiKey: "",
    monnifyLiveSecretKey: "",
    monnifyLiveContractCode: "",
    bachsEnabled: false,
    bachsSandbox: true,
    bachsSandboxApiKey: "",
    bachsLiveApiKey: "",
    bachsSandboxWebhookSecret: "",
    bachsLiveWebhookSecret: "",
    codEnabled: true,
    codAllowedStates: "",
    makeWebhookUrl: "",
    transactionalEmailWebhookUrl: "",
  });
  const [configured, setConfigured] = useState<{
    paystack: Record<string, boolean>;
    korapay: Record<string, boolean>;
    flutterwave: Record<string, boolean>;
    squad: Record<string, boolean>;
    monnify: Record<string, boolean>;
    bachs: Record<string, boolean>;
  }>({
    paystack: {},
    korapay: {},
    flutterwave: {},
    squad: {},
    monnify: {},
    bachs: {},
  });
  const [open, setOpen] = useState<Record<ProviderKey, boolean>>({
    paystack: true,
    korapay: false,
    flutterwave: false,
    squad: false,
    monnify: false,
    bachs: false,
    cod: false,
    make: false,
  });
  /** Nested environment sections — nothing expands until the admin asks. */
  const [envOpen, setEnvOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<ProviderKey | "all" | null>(null);
  const [saved, setSaved] = useState<Partial<Record<ProviderKey, boolean>>>({});
  const [testDialog, setTestDialog] = useState<TestDialogState | null>(null);

  useEffect(() => {
    void fetch("/api/payment-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setConfigured({
          paystack: data.paystackFieldsConfigured ?? {
            secretKey: Boolean(data.paystackKeyConfigured),
          },
          korapay: data.korapayFieldsConfigured ?? {
            secretKey: Boolean(data.korapayKeyConfigured),
          },
          flutterwave: data.flutterwaveFieldsConfigured ?? {
            secretKey: Boolean(data.flutterwaveKeyConfigured),
          },
          squad: data.squadKeyConfigured ?? {},
          monnify: data.monnifyKeyConfigured ?? {},
          bachs: data.bachsFieldsConfigured ?? {},
        });
      })
      .catch(() => undefined);
    void getAppSettings()
      .then((settings) => {
        if (!settings) return;
        setForm((f) => ({
          ...f,
          paystackEnabled: settings.payments?.paystackEnabled ?? false,
          paystackSandbox: settings.payments?.paystackSandbox ?? false,
          korapayEnabled: settings.payments?.korapayEnabled ?? false,
          korapaySandbox: settings.payments?.korapaySandbox ?? false,
          flutterwaveEnabled: settings.payments?.flutterwaveEnabled ?? false,
          flutterwaveSandbox:
            settings.payments?.flutterwaveSandbox ?? false,
          squadEnabled: settings.payments?.squadEnabled ?? false,
          squadSandbox: settings.payments?.squadSandbox ?? true,
          monnifyEnabled: settings.payments?.monnifyEnabled ?? false,
          monnifySandbox: settings.payments?.monnifySandbox ?? true,
          bachsEnabled: settings.payments?.bachsEnabled ?? false,
          bachsSandbox: settings.payments?.bachsSandbox ?? true,
          codEnabled: settings.payments?.codEnabled ?? true,
          codAllowedStates: (
            settings.payments?.paymentOnDeliveryAllowedStates ?? []
          ).join(","),
          makeWebhookUrl: settings.notifications?.makeWebhookUrl ?? "",
          transactionalEmailWebhookUrl:
            settings.notifications?.transactionalEmailWebhookUrl ?? "",
        }));
      })
      .catch(() => undefined);
  }, []);

  const secretPlaceholder = (configuredFlag: boolean, label: string) =>
    configuredFlag
      ? "Configured — leave blank to keep existing key"
      : `Enter ${label} (not configured)`;

  /** Persist only the named provider's settings + secrets. */
  const saveProvider = async (provider: ProviderKey) => {
    switch (provider) {
      case "paystack":
        await updateAppSettings(
          {
            payments: {
              paystackEnabled: form.paystackEnabled,
              paystackSandbox: form.paystackSandbox,
            },
          },
          actor,
        );
        await saveProviderSecrets({
          paystackSecretKey: form.paystackSecretKey,
          paystackTestSecretKey: form.paystackTestSecretKey,
        });
        break;
      case "korapay":
        await updateAppSettings(
          {
            payments: {
              korapayEnabled: form.korapayEnabled,
              korapaySandbox: form.korapaySandbox,
            },
          },
          actor,
        );
        await saveProviderSecrets({
          korapaySecretKey: form.korapaySecretKey,
          korapayTestSecretKey: form.korapayTestSecretKey,
        });
        break;
      case "flutterwave":
        await updateAppSettings(
          {
            payments: {
              flutterwaveEnabled: form.flutterwaveEnabled,
              flutterwaveSandbox: form.flutterwaveSandbox,
            },
          },
          actor,
        );
        await saveProviderSecrets({
          flutterwaveSecretKey: form.flutterwaveSecretKey,
          flutterwaveTestSecretKey: form.flutterwaveTestSecretKey,
        });
        break;
      case "squad":
        await updateAppSettings(
          {
            payments: {
              squadEnabled: form.squadEnabled,
              squadSandbox: form.squadSandbox,
            },
          },
          actor,
        );
        await saveSquadSecrets({
          sandboxSecretKey: form.squadSandboxSecretKey,
          liveSecretKey: form.squadLiveSecretKey,
        });
        break;
      case "monnify":
        await updateAppSettings(
          {
            payments: {
              monnifyEnabled: form.monnifyEnabled,
              monnifySandbox: form.monnifySandbox,
            },
          },
          actor,
        );
        await saveMonnifySecrets({
          sandboxApiKey: form.monnifySandboxApiKey,
          sandboxSecretKey: form.monnifySandboxSecretKey,
          sandboxContractCode: form.monnifySandboxContractCode,
          liveApiKey: form.monnifyLiveApiKey,
          liveSecretKey: form.monnifyLiveSecretKey,
          liveContractCode: form.monnifyLiveContractCode,
        });
        break;
      case "bachs":
        await updateAppSettings(
          {
            payments: {
              bachsEnabled: form.bachsEnabled,
              bachsSandbox: form.bachsSandbox,
            },
          },
          actor,
        );
        await saveBachsSecrets({
          sandboxApiKey: form.bachsSandboxApiKey,
          liveApiKey: form.bachsLiveApiKey,
          sandboxWebhookSecret: form.bachsSandboxWebhookSecret,
          liveWebhookSecret: form.bachsLiveWebhookSecret,
        });
        break;
      case "cod":
        await updateAppSettings(
          {
            payments: {
              codEnabled: form.codEnabled,
              paymentOnDeliveryAllowedStates: Array.from(
                new Set(
                  form.codAllowedStates
                    .split(",")
                    .map((s) => s.trim().replace(/\s+/g, " "))
                    .filter(Boolean),
                ),
              ),
            },
          },
          actor,
        );
        break;
      case "make":
        await updateAppSettings(
          {
            notifications: {
              makeWebhookUrl: form.makeWebhookUrl || undefined,
              transactionalEmailWebhookUrl:
                form.transactionalEmailWebhookUrl || undefined,
            },
          },
          actor,
        );
        break;
    }
  };

  const onSaveProvider =
    (provider: ProviderKey) => async (event: FormEvent) => {
      event.preventDefault();
      if (!actor.id || saving) return;
      setSaving(provider);
      try {
        await saveProvider(provider);
        clearPaymentProviderSettingsCache();
        setSaved((s) => ({ ...s, [provider]: true }));
        toastSuccess("Saved", `${provider} settings updated`);
      } catch (err) {
        toastError(
          "Save failed",
          err instanceof Error ? err.message : `Could not save ${provider}.`,
        );
      } finally {
        setSaving(null);
      }
    };

  const onSaveAll = async () => {
    if (!actor.id || saving) return;
    setSaving("all");
    const failed: ProviderKey[] = [];
    const done: Partial<Record<ProviderKey, boolean>> = {};
    for (const provider of PROVIDER_ORDER) {
      try {
        await saveProvider(provider);
        done[provider] = true;
      } catch {
        failed.push(provider);
      }
    }
    clearPaymentProviderSettingsCache();
    setSaved(done);
    if (failed.length) {
      toastError(
        "Some integrations were not saved",
        `Failed: ${failed.join(", ")}. Other changes were saved.`,
      );
    } else {
      toastSuccess("All integrations saved");
    }
    setSaving(null);
  };

  const toggle = (key: ProviderKey) =>
    setOpen((o) => ({ ...o, [key]: !o[key] }));
  const toggleEnv = (key: string) =>
    setEnvOpen((o) => ({ ...o, [key]: !o[key] }));

  /** Environment the provider is currently configured to run in (client view). */
  const providerEnvironment = (provider: TestableProvider) => {
    switch (provider) {
      case "paystack":
        return form.paystackSandbox ? "test" : "live";
      case "korapay":
        return form.korapaySandbox ? "test" : "live";
      case "flutterwave":
        return form.flutterwaveSandbox ? "test" : "live";
      case "squad":
        return form.squadSandbox ? "test" : "live";
      case "monnify":
        return form.monnifySandbox ? "test" : "live";
      case "bachs":
        return form.bachsSandbox ? "test" : "live";
      default:
        return "live" as const;
    }
  };

  const openTestDialog = (provider: TestableProvider, label: string) =>
    setTestDialog({
      provider,
      providerLabel: label,
      environment: providerEnvironment(provider),
      email: actor.email ?? "",
      amount: "100",
      confirmLive: false,
      running: false,
    });

  const runTestPayment = async () => {
    if (!testDialog || testDialog.running || !authUser) return;
    if (testDialog.environment === "live" && !testDialog.confirmLive) {
      setTestDialog((d) =>
        d
          ? {
              ...d,
              result: {
                ok: false,
                provider: d.provider,
                environment: d.environment,
                email: d.email,
                amount: Number(d.amount) || 0,
                currency: "NGN",
                error:
                  "Confirm the live-mode warning before running a live test.",
              },
            }
          : d,
      );
      return;
    }
    setTestDialog((d) => (d ? { ...d, running: true, result: undefined } : d));
    try {
      const token = await authUser.getIdToken();
      const res = await fetch("/api/admin/test-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: testDialog.provider,
          email: testDialog.email.trim(),
          amount: Number(testDialog.amount),
          confirmLive: testDialog.confirmLive,
        }),
      });
      const result = (await res.json().catch(() => null)) as TestResult | null;
      setTestDialog((d) =>
        d
          ? {
              ...d,
              running: false,
              result:
                result ??
                ({
                  ok: false,
                  provider: d.provider,
                  environment: d.environment,
                  email: d.email,
                  amount: Number(d.amount) || 0,
                  currency: "NGN",
                  error: `Request failed (${res.status}).`,
                } satisfies TestResult),
            }
          : d,
      );
    } catch (error) {
      setTestDialog((d) =>
        d
          ? {
              ...d,
              running: false,
              result: {
                ok: false,
                provider: d.provider,
                environment: d.environment,
                email: d.email,
                amount: Number(d.amount) || 0,
                currency: "NGN",
                error:
                  error instanceof Error
                    ? error.message
                    : "The test request failed.",
              },
            }
          : d,
      );
    }
  };

  function TestPaymentButton({ provider, label }: { provider: TestableProvider; label: string }) {
    const environment = providerEnvironment(provider);
    return (
      <div className="pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => openTestDialog(provider, label)}
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden />
          Run Test Payment
        </Button>
        <p className="mt-1 text-[11px] text-muted">
          Initializes a {environment} transaction against the saved{" "}
          {environment === "test" ? "test" : "live"} credentials. No order,
          stock change or email is created.
        </p>
      </div>
    );
  }

  function SecretField({
    id,
    label,
    value,
    configuredFlag,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    configuredFlag: boolean;
    onChange: (value: string) => void;
  }) {
    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="password"
          autoComplete="new-password"
          placeholder={secretPlaceholder(configuredFlag, label)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <RequireAdmin permission="settings:write">
      <AdminPageHeader
        title="Payment &amp; Integrations"
        description="Payment providers, API credentials and webhook URLs. Secrets are stored in a write-only collection — blank fields keep saved values."
      />
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Paystack */}
        <form onSubmit={onSaveProvider("paystack")}>
          <ProviderPanel
            title="Paystack"
            description="Card, bank transfer and USSD via Paystack checkout."
            open={open.paystack}
            onToggle={() => toggle("paystack")}
            saving={saving === "paystack" || saving === "all"}
            saved={Boolean(saved.paystack)}
          >
            <Checkbox
              label="Paystack enabled"
              checked={form.paystackEnabled}
              onChange={() =>
                setForm((f) => ({ ...f, paystackEnabled: !f.paystackEnabled }))
              }
            />
            <Checkbox
              label="Use Paystack test mode (test keys)"
              checked={form.paystackSandbox}
              onChange={() =>
                setForm((f) => ({ ...f, paystackSandbox: !f.paystackSandbox }))
              }
            />
            <EnvironmentSection
              title="Live Mode"
              active={!form.paystackSandbox}
              open={Boolean(envOpen["paystack:live"])}
              onToggle={() => toggleEnv("paystack:live")}
            >
              <SecretField
                id="paystackSecret"
                label="Paystack Live Secret Key"
                value={form.paystackSecretKey}
                configuredFlag={Boolean(configured.paystack.secretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, paystackSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <EnvironmentSection
              title="Test Mode"
              active={form.paystackSandbox}
              open={Boolean(envOpen["paystack:test"])}
              onToggle={() => toggleEnv("paystack:test")}
            >
              <SecretField
                id="paystackTestSecret"
                label="Paystack Test Secret Key"
                value={form.paystackTestSecretKey}
                configuredFlag={Boolean(configured.paystack.testSecretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, paystackTestSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <WebhookUrlRow
              label="Paystack webhook URL"
              url={`${FUNCTIONS_BASE}/paystackWebhook`}
            />
            <TestPaymentButton provider="paystack" label="Paystack" />
          </ProviderPanel>
        </form>

        {/* KoraPay */}
        <form onSubmit={onSaveProvider("korapay")}>
          <ProviderPanel
            title="KoraPay"
            description="Card, bank transfer and USSD via KoraPay checkout."
            open={open.korapay}
            onToggle={() => toggle("korapay")}
            saving={saving === "korapay" || saving === "all"}
            saved={Boolean(saved.korapay)}
          >
            <Checkbox
              label="KoraPay enabled"
              checked={form.korapayEnabled}
              onChange={() =>
                setForm((f) => ({ ...f, korapayEnabled: !f.korapayEnabled }))
              }
            />
            <Checkbox
              label="Use KoraPay test mode (test keys)"
              checked={form.korapaySandbox}
              onChange={() =>
                setForm((f) => ({ ...f, korapaySandbox: !f.korapaySandbox }))
              }
            />
            <EnvironmentSection
              title="Live Mode"
              active={!form.korapaySandbox}
              open={Boolean(envOpen["korapay:live"])}
              onToggle={() => toggleEnv("korapay:live")}
            >
              <SecretField
                id="korapaySecret"
                label="KoraPay Live Secret Key"
                value={form.korapaySecretKey}
                configuredFlag={Boolean(configured.korapay.secretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, korapaySecretKey: v }))
                }
              />
            </EnvironmentSection>
            <EnvironmentSection
              title="Test Mode"
              active={form.korapaySandbox}
              open={Boolean(envOpen["korapay:test"])}
              onToggle={() => toggleEnv("korapay:test")}
            >
              <SecretField
                id="korapayTestSecret"
                label="KoraPay Test Secret Key"
                value={form.korapayTestSecretKey}
                configuredFlag={Boolean(configured.korapay.testSecretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, korapayTestSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <WebhookUrlRow
              label="KoraPay webhook URL"
              url={`${FUNCTIONS_BASE}/korapayWebhook`}
            />
            <TestPaymentButton provider="korapay" label="KoraPay" />
          </ProviderPanel>
        </form>

        {/* Flutterwave */}
        <form onSubmit={onSaveProvider("flutterwave")}>
          <ProviderPanel
            title="Flutterwave"
            description="Flutterwave checkout (currently in preview)."
            open={open.flutterwave}
            onToggle={() => toggle("flutterwave")}
            saving={saving === "flutterwave" || saving === "all"}
            saved={Boolean(saved.flutterwave)}
          >
            <Checkbox
              label="Flutterwave enabled"
              checked={form.flutterwaveEnabled}
              onChange={() =>
                setForm((f) => ({
                  ...f,
                  flutterwaveEnabled: !f.flutterwaveEnabled,
                }))
              }
            />
            <Checkbox
              label="Use Flutterwave test mode (test keys)"
              checked={form.flutterwaveSandbox}
              onChange={() =>
                setForm((f) => ({
                  ...f,
                  flutterwaveSandbox: !f.flutterwaveSandbox,
                }))
              }
            />
            <EnvironmentSection
              title="Live Mode"
              active={!form.flutterwaveSandbox}
              open={Boolean(envOpen["flutterwave:live"])}
              onToggle={() => toggleEnv("flutterwave:live")}
            >
              <SecretField
                id="flutterwaveSecret"
                label="Flutterwave Live Secret Key"
                value={form.flutterwaveSecretKey}
                configuredFlag={Boolean(configured.flutterwave.secretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, flutterwaveSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <EnvironmentSection
              title="Test Mode"
              active={form.flutterwaveSandbox}
              open={Boolean(envOpen["flutterwave:test"])}
              onToggle={() => toggleEnv("flutterwave:test")}
            >
              <SecretField
                id="flutterwaveTestSecret"
                label="Flutterwave Test Secret Key"
                value={form.flutterwaveTestSecretKey}
                configuredFlag={Boolean(configured.flutterwave.testSecretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, flutterwaveTestSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <TestPaymentButton provider="flutterwave" label="Flutterwave" />
          </ProviderPanel>
        </form>

        {/* Squad */}
        <form onSubmit={onSaveProvider("squad")}>
          <ProviderPanel
            title="Squad by GTBank"
            description="Squad hosted checkout — card, bank transfer, USSD."
            open={open.squad}
            onToggle={() => toggle("squad")}
            saving={saving === "squad" || saving === "all"}
            saved={Boolean(saved.squad)}
          >
            <Checkbox
              label="Squad enabled"
              checked={form.squadEnabled}
              onChange={() =>
                setForm((f) => ({ ...f, squadEnabled: !f.squadEnabled }))
              }
            />
            <Checkbox
              label="Use Squad sandbox (test payments)"
              checked={form.squadSandbox}
              onChange={() =>
                setForm((f) => ({ ...f, squadSandbox: !f.squadSandbox }))
              }
            />
            <EnvironmentSection
              title="Live Mode"
              active={!form.squadSandbox}
              open={Boolean(envOpen["squad:live"])}
              onToggle={() => toggleEnv("squad:live")}
            >
              <SecretField
                id="squadLiveSecret"
                label="Squad Live Secret Key"
                value={form.squadLiveSecretKey}
                configuredFlag={Boolean(configured.squad.liveSecretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, squadLiveSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <EnvironmentSection
              title="Test Mode"
              active={form.squadSandbox}
              open={Boolean(envOpen["squad:test"])}
              onToggle={() => toggleEnv("squad:test")}
            >
              <SecretField
                id="squadSandboxSecret"
                label="Squad Sandbox Secret Key"
                value={form.squadSandboxSecretKey}
                configuredFlag={Boolean(configured.squad.sandboxSecretKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, squadSandboxSecretKey: v }))
                }
              />
            </EnvironmentSection>
            <WebhookUrlRow
              label="Squad webhook URL (API &amp; Webhook settings in the Squad dashboard)"
              url={`${FUNCTIONS_BASE}/squadWebhook`}
            />
            <TestPaymentButton provider="squad" label="Squad" />
          </ProviderPanel>
        </form>

        {/* Monnify */}
        <form onSubmit={onSaveProvider("monnify")}>
          <ProviderPanel
            title="Monnify"
            description="Monnify hosted checkout — card, bank transfer, USSD."
            open={open.monnify}
            onToggle={() => toggle("monnify")}
            saving={saving === "monnify" || saving === "all"}
            saved={Boolean(saved.monnify)}
          >
            <Checkbox
              label="Monnify enabled"
              checked={form.monnifyEnabled}
              onChange={() =>
                setForm((f) => ({ ...f, monnifyEnabled: !f.monnifyEnabled }))
              }
            />
            <Checkbox
              label="Use Monnify sandbox (test payments)"
              checked={form.monnifySandbox}
              onChange={() =>
                setForm((f) => ({ ...f, monnifySandbox: !f.monnifySandbox }))
              }
            />
            <EnvironmentSection
              title="Live Mode"
              active={!form.monnifySandbox}
              open={Boolean(envOpen["monnify:live"])}
              onToggle={() => toggleEnv("monnify:live")}
            >
              {(
                [
                  ["monnifyLiveApiKey", "Monnify Live API Key"],
                  ["monnifyLiveSecretKey", "Monnify Live Secret Key"],
                  ["monnifyLiveContractCode", "Monnify Live Contract Code"],
                ] as const
              ).map(([field, label]) => {
                const flagKey =
                  field.charAt(0).toLowerCase() + field.slice(1);
                return (
                  <SecretField
                    key={field}
                    id={field}
                    label={label}
                    value={form[field]}
                    configuredFlag={Boolean(configured.monnify[flagKey])}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [field]: v }))
                    }
                  />
                );
              })}
            </EnvironmentSection>
            <EnvironmentSection
              title="Test Mode"
              active={form.monnifySandbox}
              open={Boolean(envOpen["monnify:test"])}
              onToggle={() => toggleEnv("monnify:test")}
            >
              {(
                [
                  ["monnifySandboxApiKey", "Monnify Sandbox API Key"],
                  ["monnifySandboxSecretKey", "Monnify Sandbox Secret Key"],
                  ["monnifySandboxContractCode", "Monnify Sandbox Contract Code"],
                ] as const
              ).map(([field, label]) => {
                const flagKey =
                  field.charAt(0).toLowerCase() + field.slice(1);
                return (
                  <SecretField
                    key={field}
                    id={field}
                    label={label}
                    value={form[field]}
                    configuredFlag={Boolean(configured.monnify[flagKey])}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [field]: v }))
                    }
                  />
                );
              })}
            </EnvironmentSection>
            <WebhookUrlRow
              label="Monnify webhook URL"
              url={`${publicSiteUrl()}/api/payments/monnify/webhook`}
            />
            <TestPaymentButton provider="monnify" label="Monnify" />
          </ProviderPanel>
        </form>

        {/* Bachs */}
        <form onSubmit={onSaveProvider("bachs")}>
          <ProviderPanel
            title="Bachs.io"
            description="Bachs hosted checkout — card, bank transfer, mobile money."
            open={open.bachs}
            onToggle={() => toggle("bachs")}
            saving={saving === "bachs" || saving === "all"}
            saved={Boolean(saved.bachs)}
          >
            <Checkbox
              label="Bachs enabled"
              checked={form.bachsEnabled}
              onChange={() =>
                setForm((f) => ({ ...f, bachsEnabled: !f.bachsEnabled }))
              }
            />
            <Checkbox
              label="Use Bachs sandbox (sk_sandbox_ keys)"
              checked={form.bachsSandbox}
              onChange={() =>
                setForm((f) => ({ ...f, bachsSandbox: !f.bachsSandbox }))
              }
            />
            <EnvironmentSection
              title="Live Mode"
              active={!form.bachsSandbox}
              open={Boolean(envOpen["bachs:live"])}
              onToggle={() => toggleEnv("bachs:live")}
            >
              <SecretField
                id="bachsLiveApiKey"
                label="Bachs Live API Key"
                value={form.bachsLiveApiKey}
                configuredFlag={Boolean(configured.bachs.liveApiKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, bachsLiveApiKey: v }))
                }
              />
              <SecretField
                id="bachsLiveWebhookSecret"
                label="Bachs Live Webhook Signing Secret"
                value={form.bachsLiveWebhookSecret}
                configuredFlag={Boolean(configured.bachs.liveWebhookSecret)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, bachsLiveWebhookSecret: v }))
                }
              />
            </EnvironmentSection>
            <EnvironmentSection
              title="Test Mode"
              active={form.bachsSandbox}
              open={Boolean(envOpen["bachs:test"])}
              onToggle={() => toggleEnv("bachs:test")}
            >
              <SecretField
                id="bachsSandboxApiKey"
                label="Bachs Sandbox API Key"
                value={form.bachsSandboxApiKey}
                configuredFlag={Boolean(configured.bachs.sandboxApiKey)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, bachsSandboxApiKey: v }))
                }
              />
              <SecretField
                id="bachsSandboxWebhookSecret"
                label="Bachs Sandbox Webhook Signing Secret"
                value={form.bachsSandboxWebhookSecret}
                configuredFlag={Boolean(configured.bachs.sandboxWebhookSecret)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, bachsSandboxWebhookSecret: v }))
                }
              />
            </EnvironmentSection>
            <WebhookUrlRow
              label="Bachs webhook URL (Developer Portal → Webhooks → Add destination)"
              url={`${FUNCTIONS_BASE}/bachsWebhook`}
            />
            <p className="text-[11px] text-muted">
              Subscribe to <code>collection.succeeded</code>,{" "}
              <code>collection.failed</code>, <code>checkout.completed</code>{" "}
              and <code>checkout.expired</code>. Copy the endpoint&apos;s
              signing secret into the matching field above.
            </p>
            <TestPaymentButton provider="bachs" label="Bachs" />
          </ProviderPanel>
        </form>

        {/* COD */}
        <form onSubmit={onSaveProvider("cod")}>
          <ProviderPanel
            title="Payment on Delivery (COD)"
            description="COD availability and the states it is offered in."
            open={open.cod}
            onToggle={() => toggle("cod")}
            saving={saving === "cod" || saving === "all"}
            saved={Boolean(saved.cod)}
          >
            <Checkbox
              label="Cash on delivery enabled"
              checked={form.codEnabled}
              onChange={() =>
                setForm((f) => ({ ...f, codEnabled: !f.codEnabled }))
              }
            />
            <div>
              <Label htmlFor="codAllowedStates">
                Allowed states (comma-separated)
              </Label>
              <Input
                id="codAllowedStates"
                value={form.codAllowedStates}
                onChange={(e) =>
                  setForm((f) => ({ ...f, codAllowedStates: e.target.value }))
                }
                placeholder="Lagos, Abuja, Rivers"
              />
              <p className="mt-1 text-[11px] text-muted">
                COD is only offered in these states. A 25% commitment fee is
                charged online before the order is confirmed.
              </p>
            </div>
            <TestPaymentButton provider="cod" label="COD" />
          </ProviderPanel>
        </form>

        {/* Make.com */}
        <form onSubmit={onSaveProvider("make")}>
          <ProviderPanel
            title="Make.com"
            description="Order-notification and transactional-email webhooks."
            open={open.make}
            onToggle={() => toggle("make")}
            saving={saving === "make" || saving === "all"}
            saved={Boolean(saved.make)}
          >
            <div>
              <Label htmlFor="makeWebhookUrl">
                Make.com Order Email Webhook URL
              </Label>
              <Input
                id="makeWebhookUrl"
                type="url"
                placeholder="https://hook.us2.make.com/..."
                value={form.makeWebhookUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, makeWebhookUrl: e.target.value }))
                }
              />
              <p className="mt-1 text-[11px] text-muted">
                Notified after successful payments (existing order automation).
              </p>
            </div>
            <div>
              <Label htmlFor="transactionalEmailWebhookUrl">
                Transactional Email Webhook URL
              </Label>
              <Input
                id="transactionalEmailWebhookUrl"
                type="url"
                placeholder="https://hook.us2.make.com/..."
                value={form.transactionalEmailWebhookUrl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    transactionalEmailWebhookUrl: e.target.value,
                  }))
                }
              />
              <p className="mt-1 text-[11px] text-muted">
                Dedicated Make.com webhook for admin-triggered transactional
                emails.
              </p>
            </div>
          </ProviderPanel>
        </form>

        <Button
          type="button"
          onClick={onSaveAll}
          disabled={Boolean(saving)}
          className="w-full"
        >
          {saving === "all" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving all…
            </>
          ) : (
            "Save all integrations"
          )}
        </Button>
      </div>

      {testDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="test-payment-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  id="test-payment-title"
                  className="text-sm font-semibold text-ink"
                >
                  Run Test Payment — {testDialog.providerLabel}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  Environment:{" "}
                  <span
                    className={
                      testDialog.environment === "live"
                        ? "font-semibold text-amber-700"
                        : "font-semibold text-emerald-700"
                    }
                  >
                    {testDialog.environment === "live" ? "Live" : "Test"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestDialog(null)}
                className="rounded-md p-1 text-muted hover:bg-black/5"
                aria-label="Close test dialog"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="test-email">Customer email address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testDialog.email}
                  onChange={(e) =>
                    setTestDialog((d) =>
                      d ? { ...d, email: e.target.value } : d,
                    )
                  }
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="test-amount">Test amount (₦)</Label>
                <Input
                  id="test-amount"
                  type="number"
                  min={1}
                  step="0.01"
                  value={testDialog.amount}
                  onChange={(e) =>
                    setTestDialog((d) =>
                      d ? { ...d, amount: e.target.value } : d,
                    )
                  }
                />
              </div>

              {testDialog.environment === "live" ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[12px] font-medium text-amber-800">
                    This provider is configured in live mode. Running the test
                    will initialize a real transaction on the provider&apos;s
                    live API. It will not create an order, deduct stock or send
                    notifications — but the transaction exists on your live
                    merchant account.
                  </p>
                  <div className="mt-2">
                    <Checkbox
                      label="I understand — run a live test transaction"
                      checked={testDialog.confirmLive}
                      onChange={() =>
                        setTestDialog((d) =>
                          d ? { ...d, confirmLive: !d.confirmLive } : d,
                        )
                      }
                    />
                  </div>
                </div>
              ) : null}

              {testDialog.result ? (
                <div
                  className={`rounded-xl border p-3 ${
                    testDialog.result.ok
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <p
                    className={`text-[12px] font-semibold ${
                      testDialog.result.ok
                        ? "text-emerald-800"
                        : "text-rose-700"
                    }`}
                  >
                    {testDialog.result.ok
                      ? "Initialization succeeded"
                      : "Initialization failed"}
                  </p>
                  <dl className="mt-2 space-y-1 text-[12px] text-ink">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Provider</dt>
                      <dd className="font-medium capitalize">
                        {testDialog.result.provider}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Environment</dt>
                      <dd className="font-medium capitalize">
                        {testDialog.result.environment}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Email</dt>
                      <dd className="font-medium">
                        {testDialog.result.email}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Amount</dt>
                      <dd className="font-medium">
                        {formatPrice(testDialog.result.amount)}{" "}
                        {testDialog.result.currency}
                      </dd>
                    </div>
                    {testDialog.result.status ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Status</dt>
                        <dd className="font-medium capitalize">
                          {testDialog.result.status}
                        </dd>
                      </div>
                    ) : null}
                    {testDialog.result.reference ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Reference</dt>
                        <dd className="break-all font-mono text-[11px]">
                          {testDialog.result.reference}
                        </dd>
                      </div>
                    ) : null}
                    {testDialog.result.checkoutUrl ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Checkout URL</dt>
                        <dd className="break-all font-mono text-[11px]">
                          <a
                            href={testDialog.result.checkoutUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Open checkout
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {testDialog.result.error ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">Error</dt>
                        <dd className="text-right text-rose-700">
                          {testDialog.result.error}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTestDialog(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void runTestPayment()}
                disabled={
                  testDialog.running ||
                  (testDialog.environment === "live" &&
                    !testDialog.confirmLive)
                }
              >
                {testDialog.running ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Running…
                  </>
                ) : (
                  "Run test"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </RequireAdmin>
  );
}
