import { createFileRoute } from "@tanstack/react-router";
import { Login } from "@/components/settings/login";

export const Route = createFileRoute("/settings/client-api")({
  component: SettingsClientApiComponent,
});

function SettingsClientApiComponent() {
  return <Login />;
}
