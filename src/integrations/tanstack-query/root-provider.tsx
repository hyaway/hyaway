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

const queryClientSingleton = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: shouldRetryQuery,
    },
  },
});

export function getContext() {
  return {
    queryClient: queryClientSingleton,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
