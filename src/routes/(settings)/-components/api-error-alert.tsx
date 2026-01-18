// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { AxiosError } from "axios";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";

interface ApiErrorAlertProps {
  error: Error | null;
  /** Fallback message when error type is unknown */
  fallbackMessage?: string;
  /** Additional content to render in the description */
  children?: React.ReactNode;
}

/** Get a user-friendly title for an API error */
function getErrorTitle(error: Error | null, fallbackMessage: string): string {
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED") return "Connection timed out";
    if (error.code === "ERR_CANCELED") return "Request cancelled";
  }
  if (error instanceof Error) return error.message;
  return fallbackMessage;
}

/**
 * Reusable error alert for API errors with special handling for:
 * - Connection timeouts (ECONNABORTED)
 * - Cancelled requests (ERR_CANCELED)
 * - Hydrus API error responses
 */
export function ApiErrorAlert({
  error,
  fallbackMessage = "An unknown error occurred.",
  children,
}: ApiErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <IconAlertCircle />
      <AlertTitle>{getErrorTitle(error, fallbackMessage)}</AlertTitle>
      <AlertDescription>
        {error instanceof AxiosError && error.response?.data?.error && (
          <>
            <span>{error.response.data.error}</span>
            <br />
          </>
        )}
        {error instanceof AxiosError && error.code === "ECONNABORTED" && (
          <>
            <span>
              Could not reach the endpoint within 10 seconds. Check that Hydrus
              is running and the URL is correct.
            </span>
            <br />
          </>
        )}
        {children}
      </AlertDescription>
    </Alert>
  );
}
