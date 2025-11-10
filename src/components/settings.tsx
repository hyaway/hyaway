import { Form as FormPrimitive } from "react-aria-components";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiAccessKey,
  useApiEndpoint,
  useAuthActions,
} from "../integrations/hydrus-api/hydrus-config-store";
import {
  useRequestNewPermissionsMutation,
  useVerifyAccessQuery,
} from "../integrations/hydrus-api/queries/queries";
import { Button } from "./ui/button";
import { Heading } from "./ui/heading";
import { SecretInputField, TextInputField } from "./text-input-field";
import { ProgressCircle } from "./ui/progress-circle";
import { Note } from "./ui/note";

export function Settings() {
  const { setApiCredentials } = useAuthActions();
  const queryClient = useQueryClient();
  const defaultEndpoint = useApiEndpoint();
  const defaultAccessKey = useApiAccessKey();
  const requestNewPermissions = useRequestNewPermissionsMutation();

  const { hasRequiredPermissions, isError, error, isFetching } =
    useVerifyAccessQuery();

  const pending = requestNewPermissions.isPending || isFetching;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // IMPORTANT: new FormData(form) does NOT include the clicked submit button's name/value.
    // Modern browsers support passing the submitter (button) as the 2nd argument so its data is included.
    // Fallback for older browsers: append the submitter's name/value manually if the 2-arg ctor throws.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | HTMLInputElement
      | null;
    let formData: FormData;
    if (submitter) {
      try {
        // Feature-detect by attempting construction; spec-compliant browsers succeed.
        formData = new FormData(e.currentTarget, submitter);
      } catch (err) {
        formData = new FormData(e.currentTarget);
        // Manual fallback: only append if submitter has a name attribute.
        if (submitter.getAttribute("name")) {
          formData.append(
            submitter.getAttribute("name")!,
            submitter.getAttribute("value") || "",
          );
        }
      }
    } else {
      formData = new FormData(e.currentTarget);
    }
    const { endpoint, accessKey, action } = Object.fromEntries(formData);
    if (action === "request_api_key" && typeof endpoint === "string") {
      requestNewPermissions.mutate(
        { apiEndpoint: endpoint, name: "hydrus-archive-helper" },
        {
          onSuccess: ({ access_key }) => {
            setApiCredentials(access_key, endpoint);
            queryClient.invalidateQueries({ queryKey: ["verifyAccess"] });
          },
        },
      );
    } else if (
      action === "save" &&
      typeof endpoint === "string" &&
      typeof accessKey === "string"
    ) {
      setApiCredentials(accessKey, endpoint);
      queryClient.invalidateQueries({ queryKey: ["verifyAccess"] });
    }
  };

  return (
    <FormPrimitive
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-md flex-col gap-4"
    >
      <Heading level={2}>Hydrus API Settings</Heading>

      <TextInputField
        label="API endpoint"
        name="endpoint"
        defaultValue={defaultEndpoint}
        placeholder="http://localhost:45869"
        isRequired
        isDisabled={pending}
      />
      <Button
        type="submit"
        className="self-start"
        isDisabled={pending}
        name="action"
        value="request_api_key"
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
      {requestNewPermissions.isError && (
        <Note intent="danger">
          {requestNewPermissions.error instanceof Error
            ? requestNewPermissions.error.message
            : "An unknown error occurred while requesting new permissions."}
          <br />
          {requestNewPermissions.error instanceof AxiosError &&
            requestNewPermissions.error.response?.data?.error && (
              <span>{requestNewPermissions.error.response.data.error}</span>
            )}
        </Note>
      )}
      {requestNewPermissions.isSuccess && (
        <Note intent="success">New API access key obtained and saved.</Note>
      )}
      <SecretInputField
        label="API access key"
        name="accessKey"
        defaultValue={defaultAccessKey}
        key={defaultAccessKey}
        isRequired
        isDisabled={pending}
      />
      <Button
        type="submit"
        className="self-start"
        isDisabled={pending}
        name="action"
        value="save"
      >
        {isFetching ? (
          <ProgressCircle
            isIndeterminate
            aria-label="Checking API connection"
          />
        ) : null}
        {isFetching ? "Checking" : "Check API connection"}
      </Button>
      {!isFetching && hasRequiredPermissions && (
        <Note intent="success">API connection successful</Note>
      )}
      {!isFetching && isError && <Note intent="danger">{error.message}</Note>}
    </FormPrimitive>
  );
}
