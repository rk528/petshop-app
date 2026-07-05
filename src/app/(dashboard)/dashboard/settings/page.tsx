import prisma from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings/settings-form";

async function getSettings() {
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your store settings
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
