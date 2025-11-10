import { Form as FormPrimitive } from "react-aria-components";
import {
  useApiAccessKey,
  useApiEndpoint,
  useAuthActions,
} from "../integrations/hydrus-api/hydrus-config-store";
import {
  useRequestNewPermissionsQuery,
  useVerifyAccessQuery,
} from "../integrations/hydrus-api/queries";
import { Button } from "./ui/button";
import { Heading } from "./ui/heading";
import { SecretInputField, TextInputField } from "./text-input-field";

export function Settings() {
  const { setApiCredentials } = useAuthActions();
  const defaultEndpoint = useApiEndpoint();
  const defaultAccessKey = useApiAccessKey();
  const requestNewPermissions = useRequestNewPermissionsQuery();

  const { hasRequiredPermissions, isError, error, isPending } =
    useVerifyAccessQuery();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const { endpoint, accessKey, action } = data;
    if (action === "request_api_key" && typeof endpoint === "string") {
      requestNewPermissions.mutate(
        { apiEndpoint: endpoint, name: "hydrus-archive-helper" },
        {
          onSuccess: ({ access_key }) => {
            setApiCredentials(access_key, endpoint);
          },
        },
      );
    } else if (
      action === "save" &&
      typeof endpoint === "string" &&
      typeof accessKey === "string"
    ) {
      setApiCredentials(accessKey, endpoint);
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
        isDisabled={isPending}
      />
      <Button
        type="submit"
        className="self-start"
        isDisabled={isPending}
        name="action"
        value="request_api_key"
      >
        Request new API access key
      </Button>
      <SecretInputField
        label="API access key"
        name="accessKey"
        defaultValue={defaultAccessKey}
        isRequired
        isDisabled={isPending}
      />
      <Button
        type="submit"
        className="self-start"
        isDisabled={isPending}
        name="action"
        value="save"
      >
        {isPending ? "Verifying..." : "Save"}
      </Button>
      {hasRequiredPermissions && (
        <p className="text-green-600">API connection successful</p>
      )}
      {isError && <p className="text-red-500">{error.message}</p>}
    </FormPrimitive>
  );
}
