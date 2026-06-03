// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Suspense, lazy } from "react";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import type { QueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell/app-shell";
import { PinLockScreen } from "@/components/app-shell/pin-lock-screen";
import { GlobalTouchCountProvider } from "@/lib/global-touch-count";
import {
  useApplyTheme,
  useSystemThemeListener,
  useThemeHydrated,
} from "@/stores/theme-store";
import { useAutoLock, useShouldShowLockScreen } from "@/stores/pin-lock-store";

export interface MyRouterContext {
  queryClient: QueryClient;
  getTitle?: () => string;
  getMobileTitle?: () => string;
  /** If true, the back button uses browser history instead of parent route navigation */
  useHistoryBack?: boolean;
}

const AppDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const [devtools, routerDevtools, queryDevtools] = await Promise.all([
        import("@tanstack/react-devtools"),
        import("@tanstack/react-router-devtools"),
        import("@/integrations/tanstack-query/devtools"),
      ]);

      return {
        default: function AppDevtoolsPanel() {
          return (
            <devtools.TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <routerDevtools.TanStackRouterDevtoolsPanel />,
                },
                queryDevtools.default,
              ]}
            />
          );
        },
      };
    })
  : null;

function RootComponent() {
  const hasHydrated = useThemeHydrated();
  useApplyTheme();
  useSystemThemeListener();
  useAutoLock();

  const isLocked = useShouldShowLockScreen();

  // Block render until theme is hydrated to prevent flash
  if (!hasHydrated) {
    return null;
  }

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <GlobalTouchCountProvider>
      <AppShell>
        <Outlet />
      </AppShell>
      {AppDevtools && (
        <Suspense fallback={null}>
          <AppDevtools />
        </Suspense>
      )}
    </GlobalTouchCountProvider>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});
