import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
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
import { SwitchField } from "@/components/settings/setting-fields";
import {
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

function getDeviceInfo(): string {
  const ua = navigator.userAgent;

  // Detect browser
  let browser = "Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
}

export function RequestNewPermissionsField() {
  const [permitsEverything, setPermitsEverything] = useState(true);
  const apiEndpoint = useApiEndpoint();
  const { setApiCredentials } = useAuthActions();
  const { mutate, isPending, isSuccess, isError, error } =
    useRequestNewPermissionsMutation();
  const apiVersionQuery = useApiVersionQuery();
  const appName = useMemo(() => `hyaway (${getDeviceInfo()})`, []);

  return (
    <div className="flex flex-col gap-4">
      {apiEndpoint ? (
        <Alert>
          <IconInfoCircle />
          <AlertTitle>
            Before requesting, open api permissions dialog in Hydrus:
          </AlertTitle>
          <AlertDescription>
            <b>
              services → review services → local → client api → add → from api
              request
            </b>
          </AlertDescription>
        </Alert>
      ) : null}
      <SwitchField
        id="permits-everything"
        label="Request all permissions"
        description={
          permitsEverything
            ? "Will request full access to all current and future API features"
            : "Will request only the specific permissions this app uses"
        }
        checked={permitsEverything}
        onCheckedChange={setPermitsEverything}
        disabled={isPending}
      />

      <Button
        type="button"
        size={"default"}
        className="h-auto py-3 whitespace-normal"
        disabled={isPending || !apiEndpoint || !apiVersionQuery.isSuccess}
        name={SETTINGS_ACTION}
        value={SETTINGS_REQUEST_API_KEY_ACTION}
        onClick={() => {
          mutate(
            { name: appName, permitsEverything },
            {
              onSuccess: ({ access_key }) => {
                setApiCredentials(access_key, apiEndpoint);
              },
            },
          );
        }}
      >
        <span>
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
          <IconCircleCheck />
          <AlertTitle>New API access key saved</AlertTitle>
          <AlertDescription>
            New API access key for <b>{apiEndpoint}</b> obtained and saved.
          </AlertDescription>
        </Alert>
      ) : isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
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
