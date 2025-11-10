import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/ux")({
  component: SettingsUXComponent,
});

function SettingsUXComponent() {
  return <div className="p-4">UX Settings</div>;
}
