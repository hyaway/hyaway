import { AxiosError } from "axios";
import { Form as FormPrimitive } from "react-aria-components";
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiVersionQuery,
  useVerifyAccessQuery,
} from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { SecretInputField } from "../text-input-field";
import { Note } from "../ui/note";
import {
  SETTINGS_ACCESS_KEY_FIELD_NAME,
  SETTINGS_ACTION,
  SETTINGS_SAVE_ACCESS_KEY_ACTION,
} from "./constants";
import { getFormDataWithSubmitter } from "./form-utils";
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
      <SecretInputField
        label="API access key"
        name={SETTINGS_ACCESS_KEY_FIELD_NAME}
        defaultValue={apiAccessKey}
        key={apiAccessKey}
        isRequired
        isDisabled={isLoading}
        minLength={64}
        maxLength={64}
      />
      <Button
        type="submit"
        isDisabled={isLoading || !apiEndpoint || !apiVersionQuery.isSuccess}
        name={SETTINGS_ACTION}
        value={SETTINGS_SAVE_ACCESS_KEY_ACTION}
      >
        {isFetching ? "Checking" : "Check API connection"}
      </Button>
      {isLoading ? (
        <Note intent="info">Checking API access key...</Note>
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
          <br />
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
        </Note>
      ) : null}
    </FormPrimitive>
  );
}
