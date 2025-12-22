import { useState } from "react";
import { ApiEndpointCard } from "./api-endpoint-card";
import { AccessKeyCard } from "./access-key-card";
import { SessionKeyCard } from "./session-key-card";
import { ResetCard } from "./reset-card";
import { Heading } from "@/components/ui-primitives/heading";

export function Login() {
  const [settingsKey, setSettingsKey] = useState(0);

  const resetKey = () => {
    setSettingsKey((prev) => prev + 1);
  };
  return (
    <div className="flex flex-col gap-4" key={settingsKey}>
      <Heading level={1}>Hydrus API Settings</Heading>
      <ApiEndpointCard />
      <AccessKeyCard />
      <SessionKeyCard />
      <ResetCard resetKey={resetKey} />
    </div>
  );
}
