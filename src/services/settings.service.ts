import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { settingsDoc } from "@/firebase/collections";
import { writeAuditLog } from "@/services/audit.service";
import type { AppSettings, AppSettingsDocument } from "@/types/settings";

export async function getAppSettings(): Promise<AppSettings | undefined> {
  const snapshot = await getDoc(settingsDoc());
  return snapshot.exists() ? snapshot.data() : undefined;
}

export async function updateAppSettings(
  patch: Partial<AppSettingsDocument>,
  actor: { id: string; email?: string },
) {
  const existing = await getAppSettings();
  const { id: _settingsId, ...current } = (existing ?? {}) as AppSettings & {
    id?: string;
  };
  void _settingsId;
  await setDoc(
    settingsDoc(),
    {
      ...current,
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "settings.update",
    resourceType: "settings",
    resourceId: "app",
    previousValue: existing ?? null,
    newValue: patch,
  });
}
