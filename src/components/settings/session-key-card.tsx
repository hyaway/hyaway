import { AxiosError } from "axios";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/16/solid";
import {
  SETTINGS_ACTION,
  SETTINGS_REQUEST_SESSION_KEY_ACTION,
} from "./constants";
import {
  useVerifyPersistentAccessQuery,
  useVerifySessionAccessQuery,
} from "@/integrations/hydrus-api/queries/access";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Field, FieldLabel } from "@/components/ui-primitives/field";
import { SecretInput } from "@/components/ui-primitives/input";
import { Spinner } from "@/components/ui-primitives/spinner";
import { Button } from "@/components/ui-primitives/button";
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
  useAuthActions,
  useIsApiConfigured,
  useUseSessionKey,
} from "@/integrations/hydrus-api/hydrus-config-store";
import { refreshSessionKey } from "@/integrations/hydrus-api/api-client";
import { Switch } from "@/components/ui-primitives/switch";

export function SessionKeyCard() {
  const apiEndpoint = useApiEndpoint();
  const isConfigured = useIsApiConfigured();
  const sessionKey = useApiSessionKey();
  const useSessionKey = useUseSessionKey();
  const { setUseSessionKey } = useAuthActions();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useVerifySessionAccessQuery();
  const persistentAccessQuery = useVerifyPersistentAccessQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Get a session key</CardTitle>
        <CardDescription>
          Session key should refresh automatically, but you can do so here if
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <FieldLabel htmlFor="use-session-key-switch">
                Use session key for API requests
              </FieldLabel>
              <p className="text-muted-foreground text-sm">
                When enabled, uses session key instead of access key for all API
                requests. Session keys expire and refresh automatically.
              </p>
              <p className="text-muted-foreground text-sm">
                Session keys are more secure as they auto-expire, reducing risk
                of accessing your client if intercepted. Disable for longer
                browser caching of images and thumbnails that persists between
                Hydrus client restarts.
              </p>
            </div>
            <Switch
              id="use-session-key-switch"
              checked={useSessionKey}
              onCheckedChange={setUseSessionKey}
            />
          </div>
        </Field>
        <Field>
          <FieldLabel>API session key</FieldLabel>
          <SecretInput
            aria-label="API session key"
            value={sessionKey}
            disabled={true}
          />
        </Field>
        <Button
          type="button"
          name={SETTINGS_ACTION}
          value={SETTINGS_REQUEST_SESSION_KEY_ACTION}
          onClick={() => {
            refreshSessionKey();
          }}
          disabled={
            !apiEndpoint ||
            !isConfigured ||
            isFetching ||
            !persistentAccessQuery.isSuccess
          }
        >
          {isFetching ? "Refreshing..." : "Refresh session key"}
        </Button>
        {!sessionKey ? (
          <Alert>
            <ExclamationCircleIcon />
            <AlertTitle>No session key</AlertTitle>
          </Alert>
        ) : isLoading ? (
          <Alert>
            <Spinner />
            <AlertTitle>Checking session key...</AlertTitle>
            <AlertDescription>
              Getting new session key from <b>{apiEndpoint}</b>
            </AlertDescription>
          </Alert>
        ) : isSuccess ? (
          data.hasRequiredPermissions ? (
            <Alert>
              <CheckCircleIcon />
              <AlertTitle>Session key is valid!</AlertTitle>
              <AlertDescription>
                Connection to <b>{apiEndpoint}</b> with{" "}
                <b>{data.raw.name ?? "API"}</b> session key successful
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <ExclamationCircleIcon />
              <AlertTitle>Insufficient permissions</AlertTitle>
              <AlertDescription>
                Insufficient permissions for <b>{data.raw.name ?? "API"}</b>{" "}
                session key on <b>{apiEndpoint}</b>
              </AlertDescription>
            </Alert>
          )
        ) : isError ? (
          <Alert variant="destructive">
            <ExclamationCircleIcon />
            <AlertTitle>
              {error instanceof Error
                ? error.message
                : "An unknown error occurred while checking endpoint."}
            </AlertTitle>
            <AlertDescription>
              {error instanceof AxiosError && error.response?.data?.error ? (
                <>
                  <span>{error.response.data.error}</span>
                  <br />
                </>
              ) : null}
              API endpoint: <b>{apiEndpoint}</b>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
