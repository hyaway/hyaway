import { createFileRoute } from "@tanstack/react-router";
import { Login } from "./-components/login";

export const Route = createFileRoute("/(settings)/settings/client-api")({
  component: SettingsClientApiComponent,
  beforeLoad: () => ({
    getTitle: () => "Client API settings",
  }),
});

function SettingsClientApiComponent() {
  return <Login />;
}
