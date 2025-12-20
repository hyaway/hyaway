import { AxiosError } from "axios";
import { Form as FormPrimitive } from "react-aria-components";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/16/solid";
import { useApiVersionQuery } from "../../integrations/hydrus-api/queries/access";
import { Field, FieldLabel } from "../ui-primitives/field";
import { Input } from "../ui-primitives/input";
import { Alert, AlertDescription, AlertTitle } from "../ui-primitives/alert";
import { Spinner } from "../ui-primitives/spinner";
import {
  SETTINGS_ACTION,
  SETTINGS_ENDPOINT_FIELD_NAME,
  SETTINGS_SAVE_ENDPOINT_ACTION,
} from "./constants";
import { getFormDataWithSubmitter } from "./form-utils";
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
      action === SETTINGS_SAVE_ENDPOINT_ACTION &&
      (typeof endpoint === "string" || endpoint === null)
    ) {
      setApiCredentials(undefined, endpoint);
      queryClient.resetQueries({ queryKey: ["apiVersion"] });
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
          <Field>
            <FieldLabel>API endpoint</FieldLabel>
            <Input
              name={SETTINGS_ENDPOINT_FIELD_NAME}
              key={apiEndpoint}
              defaultValue={apiEndpoint}
              placeholder="http://localhost:45869"
              required={true}
              type="url"
            />
          </Field>
          <Button
            type="submit"
            name={SETTINGS_ACTION}
            value={SETTINGS_SAVE_ENDPOINT_ACTION}
            disabled={isFetching}
          >
            {isFetching ? "Checking endpoint..." : "Check endpoint"}
          </Button>
          {isLoading ? (
            <Alert>
              <Spinner />
              <AlertTitle>Checking endpoint...</AlertTitle>
            </Alert>
          ) : isSuccess ? (
            <Alert>
              <CheckCircleIcon />
              <AlertTitle>Endpoint is valid!</AlertTitle>
              <AlertDescription>
                API endpoint: <b>{apiEndpoint}</b>
                <br />
                Hydrus version: <b>{data.hydrus_version}</b>
                <br />
                API version: <b>{data.version}</b>
              </AlertDescription>
            </Alert>
          ) : isError ? (
            <Alert variant="destructive">
              <ExclamationCircleIcon />
              <AlertTitle>
                {error instanceof Error
                  ? error.message
                  : "An unknown error occurred while checking endpoint."}
              </AlertTitle>
              <AlertDescription>
                {error instanceof AxiosError && error.response?.data?.error && (
                  <>
                    <span>{error.response.data.error}</span>
                    <br />
                  </>
                )}
                API endpoint: <b>{apiEndpoint}</b>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </FormPrimitive>
  );
}
