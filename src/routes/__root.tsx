import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { RouterProvider } from "react-aria-components";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import type { QueryClient } from "@tanstack/react-query";
import MainNavbar from "@/components/main-nav";
import { useApplyTheme } from "@/lib/theme-store";

interface MyRouterContext {
  queryClient: QueryClient;
}

function RootComponent() {
  useApplyTheme();
  const router = useRouter();
  return (
    <>
      <RouterProvider
        navigate={(to, options) => router.navigate({ to, ...(options || {}) })}
        useHref={(to) => router.buildLocation({ to }).href}
      >
        <MainNavbar />
        <Outlet />
      </RouterProvider>
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});
