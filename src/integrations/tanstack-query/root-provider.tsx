import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClientSingleton = new QueryClient({
  defaultOptions: { queries: { staleTime: 30 * 1000 } },
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
