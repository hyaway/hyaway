// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { AxiosError } from "axios";
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { Button } from "@/components/ui-primitives/button";

interface PageErrorProps {
  error: unknown;
  fallbackMessage?: string;
}

export function PageError({
  error,
  fallbackMessage = "An unknown error occurred.",
}: PageErrorProps) {
  const [showStack, setShowStack] = useState(false);
  const stack = error instanceof Error ? error.stack : null;

  return (
    <Alert variant="destructive">
      <IconAlertCircle />
      <AlertTitle>
        {error instanceof Error ? error.message : fallbackMessage}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        {error instanceof AxiosError && error.response?.data?.error ? (
          <p>{error.response.data.error}</p>
        ) : null}

        {stack && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-auto p-0 text-xs"
              onClick={() => setShowStack((s) => !s)}
            >
              {showStack ? (
                <>
                  <IconChevronUp className="mr-1 size-3" />
                  Hide stack trace
                </>
              ) : (
                <>
                  <IconChevronDown className="mr-1 size-3" />
                  Show stack trace
                </>
              )}
            </Button>
            {showStack && (
              <pre className="bg-destructive/10 mt-2 max-h-48 overflow-auto rounded p-2 text-xs wrap-break-word whitespace-pre-wrap">
                {stack}
              </pre>
            )}
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
