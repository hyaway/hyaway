import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useVerifyAccessQuery } from "../../integrations/hydrus-api/queries/access";
import { Field, FieldLabel } from "../ui-primitives/field";
import { SecretInput } from "../ui-primitives/input";
import {
  SETTINGS_ACTION,
  SETTINGS_REQUEST_SESSION_KEY_ACTION,
} from "./constants";
import { Button } from "@/components/ui-primitives/button";
import { Note } from "@/components/ui-primitives/note";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-primitives/card";
import {
  useApiEndpoint,
  useApiSessionKey,
  useHydrusApiClient,
} from "@/integrations/hydrus-api/hydrus-config-store";

export function SessionKeyCard() {
  const queryClient = useQueryClient();
  const apiEndpoint = useApiEndpoint();
  const hydrusApi = useHydrusApiClient();
  const sessionKey = useApiSessionKey();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useVerifyAccessQuery("session");
  const persistentAccessQuery = useVerifyAccessQuery("persistent");

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>3. Get a session key</CardTitle>
        <CardDescription>
          Session key should refresh automatically, but you can do so here if
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel>API session key</FieldLabel>
          <SecretInput
            aria-label="API session key"
            key={sessionKey}
            value={sessionKey}
            disabled={true}
          />
        </Field>
        <Button
          type="button"
          name={SETTINGS_ACTION}
          value={SETTINGS_REQUEST_SESSION_KEY_ACTION}
          onClick={() => {
            hydrusApi?.refreshSessionKey().finally(() => {
              queryClient.resetQueries({
                queryKey: ["verifyAccess", "session"],
              });
            });
          }}
          disabled={
            !apiEndpoint || !hydrusApi || !persistentAccessQuery.isSuccess
          }
        >
          {isFetching ? "Refreshing" : "Refresh session key"}
        </Button>
        {!sessionKey ? (
          <Note intent="warning">No session key</Note>
        ) : isLoading ? (
          <Note intent="info">Checking session key...</Note>
        ) : isSuccess ? (
          data.hasRequiredPermissions ? (
            <Note intent="success">
              Connection to <b>{apiEndpoint}</b> with{" "}
              <b>{data.raw.name ?? "API"}</b> session key successful
            </Note>
          ) : (
            <Note intent="warning">
              Insufficient permissions for <b>{data.raw.name ?? "API"}</b>{" "}
              session key on <b>{apiEndpoint}</b>
            </Note>
          )
        ) : isError ? (
          <Note intent="danger">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred while checking endpoint."}
            <br />
            {error instanceof AxiosError && error.response?.data?.error && (
              <span>{error.response.data.error}</span>
            )}
            <br />
            API endpoint: <b>{apiEndpoint}</b>
          </Note>
        ) : null}
      </CardContent>
    </Card>
  );
}
