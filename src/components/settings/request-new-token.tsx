import { Form as FormPrimitive } from "react-aria-components";
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiEndpoint,
  useAuthActions,
} from "../../integrations/hydrus-api/hydrus-config-store";
import { useRequestNewPermissionsMutation } from "../../integrations/hydrus-api/queries/access";
import { Button } from "../ui/button";
import { TextInputField } from "../text-input-field";
import { ProgressCircle } from "../ui/progress-circle";
import { Note } from "../ui/note";
import { getFormDataWithSubmitter } from "./form-utils";

export function RequestNewTokenStep() {
  const { setApiCredentials } = useAuthActions();
  const queryClient = useQueryClient();
  const defaultApiEndpoint = useApiEndpoint();
  const requestNewPermissions = useRequestNewPermissionsMutation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { apiEndpoint, action } = getFormDataWithSubmitter(e);
    if (action === "request_api_key" && typeof apiEndpoint === "string") {
      requestNewPermissions.mutate(
        { apiEndpoint, name: "hydrus-archive-helper" },
        {
          onSuccess: ({ access_key }) => {
            setApiCredentials(access_key, apiEndpoint);
            queryClient.removeQueries({ queryKey: ["verifyAccess"] });
          },
        },
      );
    }
  };

  return (
    <FormPrimitive onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextInputField
        label="API endpoint"
        name="apiEndpoint"
        defaultValue={defaultApiEndpoint}
        placeholder="http://localhost:45869"
        isRequired
        isDisabled={requestNewPermissions.isPending}
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          name="action"
          value="request_api_key"
          isDisabled={requestNewPermissions.isPending}
        >
          {requestNewPermissions.isPending ? (
            <ProgressCircle
              isIndeterminate
              aria-label="Requesting new API access key"
            />
          ) : null}
          {requestNewPermissions.isPending
            ? "Requesting new API access key"
            : "Request new API access key"}
        </Button>
        {requestNewPermissions.isSuccess && (
          <Note intent="success">New API access key obtained and saved.</Note>
        )}
      </div>
      {requestNewPermissions.isError && (
        <Note intent="danger">
          {requestNewPermissions.error instanceof Error
            ? requestNewPermissions.error.message
            : "An unknown error occurred while requesting new permissions."}
        </Note>
      )}
    </FormPrimitive>
  );
}
