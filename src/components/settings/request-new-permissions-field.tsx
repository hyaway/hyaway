import { AxiosError } from "axios";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/16/solid";
import { SETTINGS_ACTION, SETTINGS_REQUEST_API_KEY_ACTION } from "./constants";
import {
  useApiVersionQuery,
  useRequestNewPermissionsMutation,
} from "@/integrations/hydrus-api/queries/access";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Spinner } from "@/components/ui-primitives/spinner";
import { Button } from "@/components/ui-primitives/button";
import {
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

export function RequestNewPermissionsField() {
  const apiEndpoint = useApiEndpoint();
  const { setApiCredentials } = useAuthActions();
  const { mutate, isPending, isSuccess, isError, error } =
    useRequestNewPermissionsMutation();
  const apiVersionQuery = useApiVersionQuery();

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        size={apiEndpoint ? "xl" : "default"}
        disabled={isPending || !apiEndpoint || !apiVersionQuery.isSuccess}
        name={SETTINGS_ACTION}
        value={SETTINGS_REQUEST_API_KEY_ACTION}
        onClick={() => {
          mutate(
            { apiEndpoint: apiEndpoint, name: "hyaway-app" },
            {
              onSuccess: ({ access_key }) => {
                setApiCredentials(access_key, apiEndpoint);
              },
            },
          );
        }}
      >
        <span className={"text-wrap"}>
          {isPending
            ? `Requesting new API access key for ${apiEndpoint}...`
            : apiEndpoint
              ? `Request new API access key for ${apiEndpoint}`
              : "Request new API access key"}
        </span>
      </Button>
      {!apiEndpoint ? null : isPending ? (
        <Alert>
          <Spinner />
          <AlertTitle>Requesting new API access key...</AlertTitle>
        </Alert>
      ) : isSuccess ? (
        <Alert>
          <CheckCircleIcon />
          <AlertTitle>New API access key saved</AlertTitle>
          <AlertDescription>
            New API access key for <b>{apiEndpoint}</b> obtained and saved.
          </AlertDescription>
        </Alert>
      ) : isError ? (
        <Alert variant="destructive">
          <ExclamationCircleIcon />
          <AlertTitle>
            {error instanceof Error
              ? error.message
              : "An unknown error occurred while requesting new permissions."}
          </AlertTitle>
          <AlertDescription>
            {error instanceof AxiosError && error.response?.data?.error ? (
              <span>{error.response.data.error}</span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
