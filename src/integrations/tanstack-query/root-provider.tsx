import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

/**
 * Determine if a failed query should be retried.
 * Returns false for 419 (session expired) since axios interceptor handles token refresh.
 */
function shouldRetryQuery(failureCount: number, error: Error): boolean {
  // Don't retry 419 - axios interceptor handles session refresh transparently
  if (error instanceof AxiosError && error.response?.status === 419) {
    return false;
  }

  // Default: retry up to 3 times
  return failureCount < 3;
}

const queryClientSingleton = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
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
