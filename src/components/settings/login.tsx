import { Heading } from "../ui/heading";
import { ApiEndpointCard } from "./api-endpoint-card";
import { AccessKeyCard } from "./access-key-card";
import { SessionKeyCard } from "./session-key-card";

export function Login() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Heading level={2}>Hydrus API Settings</Heading>
      <ApiEndpointCard />
      <AccessKeyCard />
      <SessionKeyCard />
    </div>
  );
}
