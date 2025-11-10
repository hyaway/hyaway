import { Form as FormPrimitive } from "react-aria-components";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAuthActions,
  useHydrusApiClient,
} from "../../integrations/hydrus-api/hydrus-config-store";
import { useVerifyAccessQuery } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { Heading } from "../ui/heading";
import { ProgressCircle } from "../ui/progress-circle";
import { Note } from "../ui/note";
import { getFormDataWithSubmitter } from "./form-utils";
import { ApiEndpointCard } from "./api-endpoint-card";
import { AccessKeyField } from "./access-key-field";
import { RequestNewPermissionsField } from "./request-new-permissions-field";
import { AccessKeyCard } from "./access-key-card";

export function Login() {
  const { setApiCredentials } = useAuthActions();
  const queryClient = useQueryClient();
  const hydrusApi = useHydrusApiClient();

  const persistentAccessQuery = useVerifyAccessQuery("persistent");
  const sessionAccessQuery = useVerifyAccessQuery("session");

  const pending =
    persistentAccessQuery.isFetching || sessionAccessQuery.isFetching;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormDataWithSubmitter(e);
    const endpoint = formData.get("endpoint");
    const accessKey = formData.get("accessKey");
    const action = formData.get("action");

    if (action === "check_endpoint") {
      queryClient.resetQueries({ queryKey: ["apiVersion"] });
    } else if (action === "request_api_key" && typeof endpoint === "string") {
    } else if (
      action === "save" &&
      typeof endpoint === "string" &&
      typeof accessKey === "string"
    ) {
      setApiCredentials(accessKey, endpoint);
      queryClient.removeQueries({ queryKey: ["verifyAccess"] });
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <FormPrimitive onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Heading level={2}>Hydrus API Settings</Heading>
        <ApiEndpointCard />
        <AccessKeyCard />
      </FormPrimitive>

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
