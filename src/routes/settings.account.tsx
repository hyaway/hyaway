import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "@/components/settings";

export const Route = createFileRoute("/settings/account")({
  component: SettingsAccountComponent,
});

function SettingsAccountComponent() {
  return (
    <div className="p-4">
      <Settings />
    </div>
  );
}
