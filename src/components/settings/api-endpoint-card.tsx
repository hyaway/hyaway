import { AxiosError } from "axios";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/16/solid";
import z from "zod";
import { useApiVersionQuery } from "../../integrations/hydrus-api/queries/access";
import { Field, FieldError, FieldLabel } from "../ui-primitives/field";
import { Input } from "../ui-primitives/input";
import { Alert, AlertDescription, AlertTitle } from "../ui-primitives/alert";
import { Spinner } from "../ui-primitives/spinner";
import { SETTINGS_ENDPOINT_FIELD_NAME } from "./constants";
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

const endpointSchema = z.url("Please enter a valid URL");

const formSchema = z.object({
  [SETTINGS_ENDPOINT_FIELD_NAME]: endpointSchema,
});

export function ApiEndpointCard() {
  const queryClient = useQueryClient();
  const apiEndpoint = useApiEndpoint();
  const { setApiCredentials } = useAuthActions();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useApiVersionQuery(apiEndpoint);

  const form = useForm({
    defaultValues: {
      [SETTINGS_ENDPOINT_FIELD_NAME]: apiEndpoint,
    } satisfies z.input<typeof formSchema>,
    onSubmit: ({ value }) => {
      setApiCredentials(undefined, value[SETTINGS_ENDPOINT_FIELD_NAME]);
      queryClient.resetQueries({ queryKey: ["apiVersion"] });
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>1. Set API endpoint</CardTitle>
          <CardDescription>
            Where is your Hydrus client running?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.Field
            name={SETTINGS_ENDPOINT_FIELD_NAME}
            validators={{ onChange: endpointSchema, onBlur: endpointSchema }}
          >
            {(field) => (
              <Field>
                <FieldLabel>API endpoint</FieldLabel>
                <Input
                  name={field.name}
                  id={field.name}
                  value={field.state.value}
                  placeholder="http://localhost:45869"
                  required={true}
                  type="url"
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {!field.state.meta.isValid && field.state.meta.isTouched && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={isFetching || !canSubmit || isSubmitting}
              >
                {isFetching || isSubmitting
                  ? "Checking endpoint..."
                  : "Check endpoint"}
              </Button>
            )}
          </form.Subscribe>
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
    </form>
  );
}
