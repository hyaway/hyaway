import { Form as FormPrimitive } from "react-aria-components";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiAccessKey,
  useApiEndpoint,
  useAuthActions,
  useHydrusApiClient,
} from "../../integrations/hydrus-api/hydrus-config-store";
import {
  useRequestNewPermissionsMutation,
  useVerifyAccessQuery,
} from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { Heading } from "../ui/heading";
import { SecretInputField, TextInputField } from "../text-input-field";
import { ProgressCircle } from "../ui/progress-circle";
import { Note } from "../ui/note";
import { getFormDataWithSubmitter } from "./form-utils";
import { ApiEndpointCard } from "./api-endpoint-card";

export function Settings() {
  const { setApiCredentials } = useAuthActions();
  const queryClient = useQueryClient();
  const defaultEndpoint = useApiEndpoint();
  const defaultAccessKey = useApiAccessKey();
  const requestNewPermissions = useRequestNewPermissionsMutation();
  const hydrusApi = useHydrusApiClient();

  const persistentAccessQuery = useVerifyAccessQuery("persistent");
  const sessionAccessQuery = useVerifyAccessQuery("session");

  const pending =
    requestNewPermissions.isPending ||
    persistentAccessQuery.isFetching ||
    sessionAccessQuery.isFetching;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { endpoint, accessKey, action } = getFormDataWithSubmitter(e);
    if (action === "check_endpoint") {
      queryClient.resetQueries({ queryKey: ["apiVersion"] });
    } else if (action === "request_api_key" && typeof endpoint === "string") {
      requestNewPermissions.mutate(
        { apiEndpoint: endpoint, name: "hydrus-archive-helper" },
        {
          onSuccess: ({ access_key }) => {
            setApiCredentials(access_key, endpoint);
            queryClient.removeQueries({ queryKey: ["verifyAccess"] });
          },
        },
      );
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

        <TextInputField
          label="API endpoint"
          name="endpoint"
          defaultValue={defaultEndpoint}
          placeholder="http://localhost:45869"
          isRequired
          isDisabled={pending}
        />
        <Button
          type="submit"
          className="self-start"
          isDisabled={pending}
          name="action"
          value="request_api_key"
        >
          {requestNewPermissions.isPending ? (
            <ProgressCircle
              isIndeterminate
              aria-label="Requesting new API access key"
            />
          ) : null}
          {requestNewPermissions.isPending
            ? "Requesting new API access key"
            : "Request new API access key"}
        </Button>
        {requestNewPermissions.isError && (
          <Note intent="danger">
            {requestNewPermissions.error instanceof Error
              ? requestNewPermissions.error.message
              : "An unknown error occurred while requesting new permissions."}
            <br />
            {requestNewPermissions.error instanceof AxiosError &&
              requestNewPermissions.error.response?.data?.error && (
                <span>{requestNewPermissions.error.response.data.error}</span>
              )}
          </Note>
        )}
        {requestNewPermissions.isSuccess && (
          <Note intent="success">New API access key obtained and saved.</Note>
        )}
        <SecretInputField
          label="API access key"
          name="accessKey"
          defaultValue={defaultAccessKey}
          key={defaultAccessKey}
          isRequired
          isDisabled={pending}
        />
        <Button
          type="submit"
          className="self-start"
          isDisabled={pending}
          name="action"
          value="save"
        >
          {persistentAccessQuery.isFetching ? (
            <ProgressCircle
              isIndeterminate
              aria-label="Checking API connection"
            />
          ) : null}
          {persistentAccessQuery.isFetching
            ? "Checking"
            : "Check API connection"}
        </Button>
        {!persistentAccessQuery.isFetching &&
          persistentAccessQuery.isSuccess &&
          persistentAccessQuery.hasRequiredPermissions && (
            <Note intent="success">Access key API connection successful</Note>
          )}
        {!persistentAccessQuery.isFetching && persistentAccessQuery.isError && (
          <Note intent="danger">{persistentAccessQuery.error.message}</Note>
        )}
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
