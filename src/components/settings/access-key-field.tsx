import { AxiosError } from "axios";
import { useVerifyAccessQuery } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { SecretInputField } from "../text-input-field";
import { Note } from "../ui/note";
import { Skeleton } from "../ui/skeleton";
import { SETTINGS_ACCESS_KEY_FIELD_NAME } from "./constants";
import {
  useApiAccessKey,
  useApiEndpoint,
} from "@/integrations/hydrus-api/hydrus-config-store";

export function AccessKeyField() {
  const apiAccessKey = useApiAccessKey();
  const apiEndpoint = useApiEndpoint();
  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useVerifyAccessQuery("persistent");

  return (
    <div className="flex flex-col gap-4">
      <SecretInputField
        label="API access key"
        name={SETTINGS_ACCESS_KEY_FIELD_NAME}
        defaultValue={apiAccessKey}
        isRequired
        isDisabled={isLoading}
      />
      <Button type="submit" isDisabled={isLoading} name="action" value="save">
        {isFetching ? "Checking" : "Check API connection"}
      </Button>
      {isLoading ? (
        <Skeleton className="h-28" />
      ) : isSuccess ? (
        data.hasRequiredPermissions ? (
          <Note intent="success">
            Connection to <b>{apiEndpoint}</b> with{" "}
            <b>{data.raw.name ?? "API"}</b> access key successful
          </Note>
        ) : (
          <Note intent="warning">
            Insufficient permissions for <b>{data.raw.name ?? "API"}</b> access
            key on <b>{apiEndpoint}</b>
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
    </div>
  );
}
