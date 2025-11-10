import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestNewPermissionsMutation } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Note } from "../ui/note";
import {
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

export function RequestNewPermissionsField() {
  const apiEndpoint = useApiEndpoint();
  const { setApiCredentials } = useAuthActions();
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, isError, error } =
    useRequestNewPermissionsMutation();

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        isDisabled={isPending || !apiEndpoint}
        name="action"
        value="request_api_key"
        onPress={() => {
          mutate(
            { apiEndpoint: apiEndpoint, name: "hydrus-archive-helper" },
            {
              onSuccess: ({ access_key }) => {
                setApiCredentials(access_key, apiEndpoint);
                queryClient.removeQueries({ queryKey: ["verifyAccess"] });
              },
            },
          );
        }}
      >
        {isPending
          ? `Requesting new API access key for ${apiEndpoint}...`
          : `Request new API access key for ${apiEndpoint}`}
      </Button>
      {isPending ? (
        <Skeleton className="h-28" />
      ) : isSuccess ? (
        <Note intent="success">
          New API access key for <b>{apiEndpoint}</b> obtained and saved.
        </Note>
      ) : isError ? (
        <Note intent="danger">
          {error instanceof Error
            ? error.message
            : "An unknown error occurred while requesting new permissions."}
          <br />
          {error instanceof AxiosError && error.response?.data?.error && (
            <span>{error.response.data.error}</span>
          )}
        </Note>
      ) : null}
    </div>
  );
}
