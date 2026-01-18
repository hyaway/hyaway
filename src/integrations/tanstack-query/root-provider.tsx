// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

/**
 * Determine if a failed query should be retried.
 * Only retries on 5xx server errors and network failures.
 * 4xx client errors are non-recoverable and should not be retried.
 */
function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    // Don't retry 4xx client errors - they're non-recoverable
    // (419 session expired is handled transparently by axios interceptor)
    if (status && status >= 400 && status < 500) {
      return false;
    }
  }

  // Retry 5xx server errors and network failures up to 3 times
  return failureCount < 3;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data doesn't change without user interaction
      retry: shouldRetryQuery,
      retryDelay: 1000, // Flat 1s delay instead of exponential backoff
    },
  },
});

export function getContext() {
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient: client,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
