// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { AxiosError } from "axios";
import { useForm } from "@tanstack/react-form";
import {
  IconCircleCheck,
  IconInfoCircle,
  IconShieldOff,
} from "@tabler/icons-react";
import z from "zod";
import { useEffect } from "react";
import { SETTINGS_ACCESS_KEY_FIELD_NAME } from "./constants";
import { ApiErrorAlert } from "./api-error-alert";
import {
  useApiVersionQuery,
  useVerifyPersistentAccessQuery,
} from "@/integrations/hydrus-api/queries/access";
import { PermissionsChecklist } from "@/components/page-shell/permissions-checklist";
import { SecretInput } from "@/components/ui-primitives/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui-primitives/field";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Spinner } from "@/components/ui-primitives/spinner";
import { Button } from "@/components/ui-primitives/button";
import {
  useApiAccessKey,
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

const accessKeySchema = z
  .string()
  .length(64, "API access key must be exactly 64 characters");

const formSchema = z.object({
  [SETTINGS_ACCESS_KEY_FIELD_NAME]: accessKeySchema,
});

export function AccessKeyField() {
  const { setApiCredentials } = useAuthActions();

  const apiAccessKey = useApiAccessKey();
  const apiEndpoint = useApiEndpoint();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useVerifyPersistentAccessQuery();

  const apiVersionQuery = useApiVersionQuery();

  const form = useForm({
    defaultValues: {
      [SETTINGS_ACCESS_KEY_FIELD_NAME]: apiAccessKey,
    } satisfies z.input<typeof formSchema>,
    onSubmit: ({ value }) => {
      setApiCredentials(value[SETTINGS_ACCESS_KEY_FIELD_NAME], undefined);
    },
  });

  useEffect(() => {
    form.reset();
  }, [apiAccessKey]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name={SETTINGS_ACCESS_KEY_FIELD_NAME}
        validators={{ onChange: accessKeySchema }}
      >
        {(field) => (
          <Field>
            <FieldLabel>API access key</FieldLabel>
            <SecretInput
              aria-label="API access key"
              name={field.name}
              id={field.name}
              value={field.state.value}
              required={true}
              disabled={isLoading}
              minLength={64}
              maxLength={64}
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
            disabled={
              isLoading ||
              isFetching ||
              !canSubmit ||
              isSubmitting ||
              !apiEndpoint ||
              !apiVersionQuery.isSuccess
            }
          >
            {isFetching || isSubmitting ? "Checking" : "Check API connection"}
          </Button>
        )}
      </form.Subscribe>
      {isLoading ? (
        <Alert>
          <Spinner />
          <AlertTitle>Checking API access key...</AlertTitle>
          <AlertDescription>
            Calling <b>{apiEndpoint}</b> with provided access key
          </AlertDescription>
        </Alert>
      ) : isSuccess ? (
        data.hasRequiredPermissions ? (
          <Alert>
            <IconCircleCheck />
            <AlertTitle>API access key is valid!</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>
                Connection to <b>{apiEndpoint}</b> with{" "}
                <b>{data.raw.name ?? "API"}</b> access key successful
              </span>
              <PermissionsChecklist permissionsData={data.raw} />
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <IconShieldOff />
            <AlertTitle>Missing required permission</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>
                Your access key <b>{data.raw.name ?? "API"}</b> on{" "}
                <b>{apiEndpoint}</b> is missing the required permission. Update
                your API key in Hydrus to include it (or permit everything):
              </span>
              <PermissionsChecklist permissionsData={data.raw} />
            </AlertDescription>
          </Alert>
        )
      ) : isError ? (
        <>
          {error instanceof AxiosError && error.response?.status === 403 ? (
            <Alert>
              <IconInfoCircle />
              <AlertTitle>Complete the Hydrus permissions flow</AlertTitle>
              <AlertDescription>
                If you just requested a token, complete the permissions flow in
                Hydrus client then press <i>Check API connection</i> above to
                check again.
              </AlertDescription>
            </Alert>
          ) : null}
          <ApiErrorAlert
            error={error}
            fallbackMessage="An unknown error occurred while checking access key."
          >
            {error instanceof AxiosError && error.response?.status === 403 && (
              <>
                <span>
                  If you just requested a token, complete the permissions flow
                  in Hydrus client then check API connection
                </span>
                <br />
              </>
            )}
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
          </ApiErrorAlert>
        </>
      ) : null}
    </form>
  );
}
