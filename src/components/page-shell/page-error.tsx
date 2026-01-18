// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { AxiosError } from "axios";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";

interface PageErrorProps {
  error: unknown;
  fallbackMessage?: string;
}

export function PageError({
  error,
  fallbackMessage = "An unknown error occurred.",
}: PageErrorProps) {
  return (
    <Alert variant="destructive">
      <IconAlertCircle />
      <AlertTitle>
        {error instanceof Error ? error.message : fallbackMessage}
      </AlertTitle>
      <AlertDescription>
        {error instanceof AxiosError && error.response?.data?.error ? (
          <span>{error.response.data.error}</span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
