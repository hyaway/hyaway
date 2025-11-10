import { AxiosError } from "axios";
import { useVerifyAccessQuery } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { SecretInputField } from "../text-input-field";
import { Note } from "../ui/note";
import { CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useApiAccessKey } from "@/integrations/hydrus-api/hydrus-config-store";

export function AccessKeyField() {
  const apiAccessKey = useApiAccessKey();
  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useVerifyAccessQuery("persistent");

  return (
    <CardContent className="flex flex-col gap-4">
      <SecretInputField
        label="API access key"
        name="accessKey"
        defaultValue={apiAccessKey}
        isRequired
        isDisabled={isLoading}
      />
      <Button
        type="submit"
        className="self-start"
        isDisabled={isLoading}
        name="action"
        value="save"
      >
        {isFetching ? "Checking" : "Check API connection"}
      </Button>
      {isLoading ? (
        <Skeleton className="h-28" />
      ) : isSuccess ? (
        data.hasRequiredPermissions ? (
          <Note intent="success">Access key API connection successful</Note>
        ) : (
          <Note intent="warning">
            Insufficient permissions for {data.raw.name ?? "API"} access key
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
        </Note>
      ) : null}
    </CardContent>
  );
}
