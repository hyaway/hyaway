import { Form as FormPrimitive } from "react-aria-components";
import {
  useApiAccessKey,
  useApiEndpoint,
  useAuthActions,
} from "../hooks/useAuth";
import { useVerifyAccessQuery } from "../integrations/hydrus-api/queries";
import { Button } from "./ui/button";
import { Heading } from "./ui/heading";
import { SecretInputField, TextInputField } from "./text-input-field";

export function Settings() {
  const { setApiCredentials } = useAuthActions();
  const defaultEndpoint = useApiEndpoint();
  const defaultAccessKey = useApiAccessKey();

  const { hasRequiredPermissions, isError, error, isPending } =
    useVerifyAccessQuery();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const { endpoint, accessKey } = data;
    if (typeof endpoint === "string" && typeof accessKey === "string") {
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
        label="API Endpoint"
        name="endpoint"
        defaultValue={defaultEndpoint}
        placeholder="http://localhost:45869"
        isRequired
        isDisabled={isPending}
      />
      <SecretInputField
        label="API Access Key"
        name="accessKey"
        defaultValue={defaultAccessKey}
        isRequired
        isDisabled={isPending}
      />
      <Button type="submit" className="self-start" isDisabled={isPending}>
        {isPending ? "Verifying..." : "Save"}
      </Button>
      {hasRequiredPermissions && (
        <p className="text-green-600">API connection successful</p>
      )}
      {isError && <p className="text-red-500">{error.message}</p>}
    </FormPrimitive>
  );
}
