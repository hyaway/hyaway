// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconRefresh,
} from "@tabler/icons-react";
import { Button } from "@/components/ui-primitives/button";

interface RouteErrorProps {
  error: Error;
  reset?: () => void;
}

/**
 * Error component for route-level errors caught by TanStack Router.
 * Shows error message with stack trace toggle.
 */
export function RouteError({ error, reset }: RouteErrorProps) {
  const [showStack, setShowStack] = useState(false);
  const router = useRouter();

  const handleGoBack = () => {
    router.history.back();
  };

  const handleReload = () => {
    if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 py-16">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <IconAlertTriangle className="text-destructive size-8" />
          <h1 className="text-2xl font-bold">Something went wrong!</h1>
        </div>

        <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
          <p className="text-destructive font-mono text-sm">{error.message}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGoBack} variant="outline" className="gap-2">
            <IconArrowLeft className="size-4" />
            Go back
          </Button>
          <Button onClick={handleReload} className="gap-2">
            <IconRefresh className="size-4" />
            Try again
          </Button>
          <Button variant="ghost" onClick={() => setShowStack((s) => !s)}>
            {showStack ? "Hide" : "Show"} Error Details
          </Button>
        </div>

        {showStack && error.stack && (
          <div className="bg-muted overflow-x-auto rounded-lg p-4">
            <pre className="text-muted-foreground text-xs wrap-break-word whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        )}

        <p className="text-muted-foreground text-sm">
          If this keeps happening, try clearing your browser cache or opening in
          a private window.
        </p>
      </div>
    </div>
  );
}
