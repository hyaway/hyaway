import { useState } from "react";
import { Heading } from "../ui/heading";
import { ApiEndpointCard } from "./api-endpoint-card";
import { AccessKeyCard } from "./access-key-card";
import { SessionKeyCard } from "./session-key-card";
import { ResetCard } from "./reset-card";

export function Login() {
  const [settingsKey, setSettingsKey] = useState(0);

  const resetKey = () => {
    setSettingsKey((prev) => prev + 1);
  };
  return (
    <div key={settingsKey} className="mx-auto flex max-w-lg flex-col gap-4">
      <Heading level={2}>Hydrus API Settings</Heading>
      <ApiEndpointCard />
      <AccessKeyCard />
      <SessionKeyCard />
      <ResetCard resetKey={resetKey} />
    </div>
  );
}
