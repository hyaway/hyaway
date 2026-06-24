// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";
import { useEffect } from "react";
import { SETTINGS_ENDPOINT_FIELD_NAME } from "./constants";
import { ApiErrorAlert } from "./api-error-alert";
import { useApiVersionQuery } from "@/integrations/hydrus-api/queries/access";
import { Field, FieldLabel } from "@/components/ui-primitives/field";
import { Input } from "@/components/ui-primitives/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Spinner } from "@/components/ui-primitives/spinner";
import { Button } from "@/components/ui-primitives/button";
import { Toggle } from "@/components/ui-primitives/toggle";
import { SettingsCardTitle } from "@/components/settings/settings-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui-primitives/card";
import {
  PRESET_ENDPOINT,
  useApiEndpoint,
  useAuthActions,
} from "@/integrations/hydrus-api/hydrus-config-store";

type Protocol = "https://" | "http://";

const RECOMMENDED_CLIENT_API_VERSION = 87;
const MANY_FEATURES_BROKEN_CLIENT_API_VERSION = 78;
const MOST_FEATURES_BROKEN_CLIENT_API_VERSION = 66;

const CLIENT_API_COMPATIBILITY_WARNINGS = [
  {
    apiVersion: 87,
    hydrusVersion: 657,
    label: "Rating overlays and rating settings will be incomplete.",
  },
  {
    apiVersion: 83,
    hydrusVersion: 649,
    label: "Custom rating icons will not load.",
  },
  {
    apiVersion: 80,
    hydrusVersion: 622,
    label: "Favourite tags will not load or save.",
  },
  {
    apiVersion: 78,
    hydrusVersion: 607,
    label: "Watch history sync and view-count tools will not work.",
  },
  {
    apiVersion: 71,
    hydrusVersion: 591,
    label: "The automatic access-key setup can fail.",
  },
  {
    apiVersion: 69,
    hydrusVersion: 588,
    label: "Some gallery and search filters will not work correctly.",
  },
  {
    apiVersion: 66,
    hydrusVersion: 584,
    label: "Remote Hydrus pages can fail to load.",
  },
] as const;

function getCompatibilityWarnings(apiVersion: number) {
  return CLIENT_API_COMPATIBILITY_WARNINGS.filter(
    (warning) => apiVersion < warning.apiVersion,
  );
}

function getCompatibilityAlertCopy(apiVersion: number) {
  if (apiVersion < MOST_FEATURES_BROKEN_CLIENT_API_VERSION) {
    return {
      title: "Hydrus is too old for most hyAway features",
      message:
        "hyAway uses many Hydrus Client API features that your Hydrus client does not have. Most of hyAway will not work correctly until Hydrus is updated.",
    };
  }

  if (apiVersion < MANY_FEATURES_BROKEN_CLIENT_API_VERSION) {
    return {
      title: "Hydrus is missing many hyAway features",
      message:
        "Your Hydrus client is missing Client API features that hyAway uses for setup, searches, pages, tags, and watch history. Some parts of hyAway will break.",
    };
  }

  return {
    title: "Hydrus is missing some hyAway features",
    message:
      "hyAway uses a lot of newer Hydrus Client API features. Your Hydrus client is older, so these hyAway features are likely to break.",
  };
}

/** Parse a URL into protocol and host parts */
function parseEndpoint(url: string): { protocol: Protocol; host: string } {
  const lower = url.toLowerCase();
  if (lower.startsWith("https://")) {
    return { protocol: "https://", host: url.slice(8) };
  }
  if (lower.startsWith("http://")) {
    return { protocol: "http://", host: url.slice(7) };
  }
  // Default to http if no protocol (localhost is common default)
  return { protocol: "http://", host: url };
}

/** Check if input contains a protocol prefix */
function hasProtocolPrefix(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.startsWith("https://") || lower.startsWith("http://");
}

export function ApiEndpointCard() {
  const apiEndpoint = useApiEndpoint();
  const { setApiCredentials } = useAuthActions();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isSuccess, isError, error } =
    useApiVersionQuery();

  const form = useForm({
    defaultValues: parseEndpoint(apiEndpoint),
    onSubmit: ({ value }) => {
      const cleanedHost = value.host.trim().replace(/\/+$/, "");
      const url = `${value.protocol}${cleanedHost}`;
      setApiCredentials(undefined, url);
      // Update form with cleaned value (needed when store value didn't change)
      if (cleanedHost !== value.host) {
        form.setFieldValue("host", cleanedHost);
      }
    },
  });

  // Cancel pending query when form becomes dirty
  useEffect(() => {
    const subscription = form.store.subscribe(() => {
      const isDirty = form.state.isDirty;
      if (isDirty && isFetching) {
        queryClient.cancelQueries({ queryKey: ["apiVersion"] });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isFetching, queryClient]);

  // Reset form when stored endpoint changes externally
  useEffect(() => {
    form.reset({ ...parseEndpoint(apiEndpoint) });
  }, [apiEndpoint, form]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <SettingsCardTitle>1. Set API endpoint</SettingsCardTitle>
          <CardDescription>
            Use{" "}
            <span className="text-foreground font-mono">127.0.0.1:45869</span>{" "}
            if Hydrus is running on this device, or your remote URL if it is
            running on another device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor={SETTINGS_ENDPOINT_FIELD_NAME}>
              API endpoint
            </FieldLabel>
            <div className="flex items-center gap-2">
              <form.Field name="protocol">
                {(field) => (
                  <Toggle
                    size="sm"
                    variant="outline"
                    pressed={field.state.value === "https://"}
                    onPressedChange={(pressed) =>
                      field.handleChange(pressed ? "https://" : "http://")
                    }
                    aria-label="Use HTTPS"
                    className="shrink-0 font-mono"
                  >
                    {field.state.value === "https://" ? "https://" : "http://"}
                  </Toggle>
                )}
              </form.Field>
              <form.Field name="host">
                {(field) => (
                  <Input
                    name={SETTINGS_ENDPOINT_FIELD_NAME}
                    id={SETTINGS_ENDPOINT_FIELD_NAME}
                    value={field.state.value}
                    placeholder="127.0.0.1:45869"
                    required={true}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Detect and strip protocol if user pastes/types full URL
                      if (hasProtocolPrefix(value)) {
                        const parsed = parseEndpoint(value);
                        form.setFieldValue("protocol", parsed.protocol);
                        field.handleChange(parsed.host);
                      } else {
                        field.handleChange(value);
                      }
                    }}
                    onBlur={field.handleBlur}
                    className="flex-1"
                  />
                )}
              </form.Field>
            </div>
            {PRESET_ENDPOINT && apiEndpoint === PRESET_ENDPOINT && (
              <span className="text-muted-foreground text-xs">
                Preconfigured value
              </span>
            )}
          </Field>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.values.host] as const}
          >
            {([canSubmit, host]) => (
              <Button
                type="submit"
                disabled={isFetching || !canSubmit || !host.trim()}
              >
                {isFetching ? "Checking endpoint..." : "Check endpoint"}
              </Button>
            )}
          </form.Subscribe>
          {isLoading ? (
            <Alert>
              <Spinner />
              <AlertTitle>Checking endpoint...</AlertTitle>
              <AlertDescription>
                Calling <b>{apiEndpoint}</b>
              </AlertDescription>
            </Alert>
          ) : isSuccess ? (
            <>
              <Alert>
                <IconCircleCheck />
                <AlertTitle>Endpoint is valid!</AlertTitle>
                <AlertDescription>
                  API endpoint: <b>{apiEndpoint}</b>
                  <br />
                  Hydrus version: <b>{data.hydrus_version}</b>
                  <br />
                  API version: <b>{data.version}</b>
                </AlertDescription>
              </Alert>
              {data.version < RECOMMENDED_CLIENT_API_VERSION && (
                <HydrusClientApiCompatibilityAlert apiVersion={data.version} />
              )}
            </>
          ) : isError ? (
            <ApiErrorAlert
              error={error}
              fallbackMessage="An unknown error occurred while checking endpoint."
            >
              API endpoint: <b>{apiEndpoint}</b>
            </ApiErrorAlert>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
}

function HydrusClientApiCompatibilityAlert({
  apiVersion,
}: {
  apiVersion: number;
}) {
  const warnings = getCompatibilityWarnings(apiVersion);
  const mostFeaturesWillBreak =
    apiVersion < MOST_FEATURES_BROKEN_CLIENT_API_VERSION;
  const alertCopy = getCompatibilityAlertCopy(apiVersion);

  return (
    <Alert variant={mostFeaturesWillBreak ? "destructive" : "default"}>
      <IconAlertTriangle />
      <AlertTitle>{alertCopy.title}</AlertTitle>
      <AlertDescription>
        <p>{alertCopy.message}</p>
        {!mostFeaturesWillBreak && (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning.apiVersion}>
                <b>API {warning.apiVersion}</b> / Hydrus {warning.hydrusVersion}
                : {warning.label}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
