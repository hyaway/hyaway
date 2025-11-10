import { useQueryClient } from "@tanstack/react-query";
import { useHydrusApiClient } from "../../integrations/hydrus-api/hydrus-config-store";
import { useVerifyAccessQuery } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { Heading } from "../ui/heading";
import { ProgressCircle } from "../ui/progress-circle";
import { Note } from "../ui/note";
import { ApiEndpointCard } from "./api-endpoint-card";
import { AccessKeyCard } from "./access-key-card";

export function Login() {
  const queryClient = useQueryClient();
  const hydrusApi = useHydrusApiClient();

  const persistentAccessQuery = useVerifyAccessQuery("persistent");
  const sessionAccessQuery = useVerifyAccessQuery("session");

  const pending =
    persistentAccessQuery.isFetching || sessionAccessQuery.isFetching;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <Heading level={2}>Hydrus API Settings</Heading>
      <ApiEndpointCard />
      <AccessKeyCard />

      {!sessionAccessQuery.isLoading && (
        <Button
          type="button"
          className="self-start"
          isDisabled={pending}
          onClick={async () => {
            await hydrusApi?.refreshSessionKey();
            queryClient.removeQueries({
              queryKey: ["verifyAccess", "session"],
            });
          }}
        >
          {sessionAccessQuery.isFetching ? (
            <ProgressCircle
              isIndeterminate
              aria-label="Refreshing session key"
            />
          ) : null}
          {sessionAccessQuery.isFetching ? "Refreshing" : "Refresh session key"}
        </Button>
      )}
      {!sessionAccessQuery.isFetching &&
        sessionAccessQuery.isSuccess &&
        sessionAccessQuery.hasRequiredPermissions && (
          <Note intent="success">Session key API connection successful</Note>
        )}
      {!sessionAccessQuery.isFetching && sessionAccessQuery.isError && (
        <Note intent="danger">{sessionAccessQuery.error.message}</Note>
      )}
    </div>
  );
}
