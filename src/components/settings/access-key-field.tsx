import { AxiosError } from "axios";
import { Form as FormPrimitive } from "react-aria-components";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/16/solid";
import {
  useApiVersionQuery,
  useVerifyAccessQuery,
} from "../../integrations/hydrus-api/queries/access";
import { SecretInput } from "../ui-primitives/input";
import { Field, FieldLabel } from "../ui-primitives/field";
import { Alert, AlertDescription, AlertTitle } from "../ui-primitives/alert";
import { Spinner } from "../ui-primitives/spinner";
import {
  SETTINGS_ACCESS_KEY_FIELD_NAME,
  SETTINGS_ACTION,
  SETTINGS_SAVE_ACCESS_KEY_ACTION,
} from "./constants";
import { getFormDataWithSubmitter } from "./form-utils";
import { Button } from "@/components/ui-primitives/button";
import {
  useApiAccessKey,
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

export function AccessKeyField() {
  const queryClient = useQueryClient();
  const { setApiCredentials } = useAuthActions();

  const apiAccessKey = useApiAccessKey();
  const apiEndpoint = useApiEndpoint();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useVerifyAccessQuery("persistent");

  const apiVersionQuery = useApiVersionQuery(apiEndpoint);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = getFormDataWithSubmitter(e);
    const accessKey = formData.get(SETTINGS_ACCESS_KEY_FIELD_NAME);
    const action = formData.get(SETTINGS_ACTION);

    if (
      action === SETTINGS_SAVE_ACCESS_KEY_ACTION &&
      (typeof accessKey === "string" || accessKey === null)
    ) {
      setApiCredentials(accessKey, undefined);
      queryClient.resetQueries({ queryKey: ["verifyAccess"] });
    }
  };

  return (
    <FormPrimitive onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <FieldLabel>API access key</FieldLabel>
        <SecretInput
          aria-label="API access key"
          name={SETTINGS_ACCESS_KEY_FIELD_NAME}
          defaultValue={apiAccessKey}
          key={apiAccessKey}
          required={true}
          disabled={isLoading}
          minLength={64}
          maxLength={64}
        />
      </Field>
      <Button
        type="submit"
        disabled={isLoading || !apiEndpoint || !apiVersionQuery.isSuccess}
        name={SETTINGS_ACTION}
        value={SETTINGS_SAVE_ACCESS_KEY_ACTION}
      >
        {isFetching ? "Checking" : "Check API connection"}
      </Button>
      {isLoading ? (
        <Alert>
          <Spinner />
          <AlertTitle>Checking API access key...</AlertTitle>
        </Alert>
      ) : isSuccess ? (
        data.hasRequiredPermissions ? (
          <Alert>
            <CheckCircleIcon />
            <AlertTitle>API access key is valid!</AlertTitle>
            <AlertDescription>
              Connection to <b>{apiEndpoint}</b> with{" "}
              <b>{data.raw.name ?? "API"}</b> access key successful
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <ExclamationCircleIcon />
            <AlertTitle>Insufficient permissions</AlertTitle>
            <AlertDescription>
              Insufficient permissions for <b>{data.raw.name ?? "API"}</b>
              access key on <b>{apiEndpoint}</b>
            </AlertDescription>
          </Alert>
        )
      ) : isError ? (
        <>
          {error instanceof AxiosError && error.response?.status === 403 ? (
            <Alert>
              <InformationCircleIcon />
              <AlertTitle>Complete the Hydrus permissions flow</AlertTitle>
              <AlertDescription>
                If you just requested a token, complete the permissions flow in
                Hydrus client then press <i>Check API connection</i> above to
                check again.
              </AlertDescription>
            </Alert>
          ) : null}
          <Alert variant="destructive">
            <ExclamationCircleIcon />
            <AlertTitle>
              {error instanceof Error
                ? error.message
                : "An unknown error occurred while checking endpoint."}
            </AlertTitle>
            <AlertDescription>
              {error instanceof AxiosError ? (
                <>
                  <span>{error.response?.data.error}</span>
                  <br />
                  <span>
                    {error.response?.status === 403 &&
                      "If you just requested a token, complete the permissions flow in Hydrus client then check API connection"}
                  </span>
                  <br />
                </>
              ) : null}
              API Access key:{" "}
              <b>
                {apiAccessKey
                  ? apiAccessKey.length <= 6
                    ? apiAccessKey
                    : `${apiAccessKey.slice(0, 2)}●●●●${apiAccessKey.slice(-4)}`
                  : ""}
              </b>
              <br />
              API endpoint: <b>{apiEndpoint}</b>
            </AlertDescription>
          </Alert>
        </>
      ) : null}
    </FormPrimitive>
  );
}
