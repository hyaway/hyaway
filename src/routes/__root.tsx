// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import type { QueryClient } from "@tanstack/react-query";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";

import { AppShell } from "@/components/app-shell/app-shell";
import { GlobalTouchCountProvider } from "@/lib/global-touch-count";
import {
  useApplyTheme,
  useSystemThemeListener,
  useThemeHydrated,
} from "@/stores/theme-store";

export interface MyRouterContext {
  queryClient: QueryClient;
  getTitle?: () => string;
  /** If true, the back button uses browser history instead of parent route navigation */
  useHistoryBack?: boolean;
}

function RootComponent() {
  const hasHydrated = useThemeHydrated();
  useApplyTheme();
  useSystemThemeListener();

  // Block render until theme is hydrated to prevent flash
  if (!hasHydrated) {
    return null;
  }

  return (
    <GlobalTouchCountProvider>
      <AppShell>
        <Outlet />
      </AppShell>
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
    </GlobalTouchCountProvider>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});
