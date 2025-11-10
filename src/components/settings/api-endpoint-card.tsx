import { AxiosError } from "axios";
import { useApiVersionQuery } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { TextInputField } from "../text-input-field";
import { Note } from "../ui/note";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useApiEndpoint } from "@/integrations/hydrus-api/hydrus-config-store";

export function ApiEndpointCard() {
  const apiEndpoint = useApiEndpoint();
  const { data, isFetching, isSuccess, isError, error } =
    useApiVersionQuery(apiEndpoint);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>1. Set API endpoint</CardTitle>
        <CardDescription>Where is your Hydrus client running?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <TextInputField
          label="API endpoint"
          name="apiEndpoint"
          defaultValue={apiEndpoint}
          placeholder="http://localhost:45869"
          isRequired
          type="url"
        />
        <Button
          type="submit"
          name="action"
          value="check_endpoint"
          isDisabled={isFetching}
        >
          {isFetching ? "Checking endpoint..." : "Check endpoint"}
        </Button>
        {isFetching ? (
          <Skeleton className="h-28" />
        ) : isSuccess ? (
          <Note intent="success">
            Api endpoint: <b>{apiEndpoint}</b>
            <br />
            Hydrus version: <b>{data.hydrus_version}</b>
            <br />
            API version: <b>{data.version}</b>
          </Note>
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
    </Card>
  );
}
