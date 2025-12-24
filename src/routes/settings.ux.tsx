import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/ux")({
  component: SettingsUXComponent,
  beforeLoad: () => ({
    getTitle: () => "UX settings",
  }),
});

function SettingsUXComponent() {
  return <div className="p-4">UX Settings</div>;
}
