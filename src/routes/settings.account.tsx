import { createFileRoute } from "@tanstack/react-router";
import { Login } from "@/components/settings/login";

export const Route = createFileRoute("/settings/account")({
  component: SettingsAccountComponent,
});

function SettingsAccountComponent() {
  return <Login />;
}
