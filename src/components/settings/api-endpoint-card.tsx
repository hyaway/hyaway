import { AxiosError } from "axios";
import { Form as FormPrimitive } from "react-aria-components";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  SETTINGS_ACTION,
  SETTINGS_CHECK_ENDPOINT_ACTION,
  SETTINGS_ENDPOINT_FIELD_NAME,
} from "./constants";
import { getFormDataWithSubmitter } from "./form-utils";
import {
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

export function ApiEndpointCard() {
  const queryClient = useQueryClient();
  const apiEndpoint = useApiEndpoint();
  const { setApiCredentials } = useAuthActions();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useApiVersionQuery(apiEndpoint);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormDataWithSubmitter(e);
    const endpoint = formData.get(SETTINGS_ENDPOINT_FIELD_NAME);
    const action = formData.get(SETTINGS_ACTION);

    if (
      action === SETTINGS_CHECK_ENDPOINT_ACTION &&
      (typeof endpoint === "string" || endpoint === null)
    ) {
      setApiCredentials(undefined, endpoint);
      queryClient.invalidateQueries({ queryKey: ["apiVersion"] });
    }
  };
  return (
    <FormPrimitive onSubmit={handleSubmit}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>1. Set API endpoint</CardTitle>
          <CardDescription>
            Where is your Hydrus client running?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TextInputField
            label="API endpoint"
            name={SETTINGS_ENDPOINT_FIELD_NAME}
            defaultValue={apiEndpoint}
            placeholder="http://localhost:45869"
            isRequired
            type="url"
          />
          <Button
            type="submit"
            name={SETTINGS_ACTION}
            value={SETTINGS_CHECK_ENDPOINT_ACTION}
            isDisabled={isFetching}
          >
            {isFetching ? "Checking endpoint..." : "Check endpoint"}
          </Button>
          {isLoading ? (
            <Skeleton className="h-28" />
          ) : isSuccess ? (
            <Note intent="success">
              API endpoint: <b>{apiEndpoint}</b>
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
              API endpoint: <b>{apiEndpoint}</b>
            </Note>
          ) : null}
        </CardContent>
      </Card>
    </FormPrimitive>
  );
}
