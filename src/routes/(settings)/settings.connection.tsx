import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ApiEndpointCard } from "./-components/api-endpoint-card";
import { AccessKeyCard } from "./-components/access-key-card";
import { SessionKeyCard } from "./-components/session-key-card";
import { ResetCard } from "./-components/reset-card";
import { Heading } from "@/components/ui-primitives/heading";

export const Route = createFileRoute("/(settings)/settings/connection")({
  component: SettingsConnectionComponent,
  beforeLoad: () => ({
    getTitle: () => "Connection settings",
    useHistoryBack: true,
  }),
});

function SettingsConnectionComponent() {
  const [settingsKey, setSettingsKey] = useState(0);

  const resetKey = () => {
    setSettingsKey((prev) => prev + 1);
  };

  return (
    <div className="flex max-w-xl flex-col gap-4" key={settingsKey}>
      <Heading level={2} className="sr-only">
        Connection
      </Heading>
      <p className="text-muted-foreground text-sm">
        Connect to your Hydrus client's API.
        <br /> Need help?{" "}
        <a
          href="https://github.com/hyaway/hyaway/blob/main/docs/SETUP.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Read the setup guide
        </a>
        .
      </p>
      <ApiEndpointCard />
      <AccessKeyCard />
      <SessionKeyCard />
      <ResetCard resetKey={resetKey} />
    </div>
  );
}
