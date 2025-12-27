import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import type { QueryClient } from "@tanstack/react-query";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";

import { AppHeader } from "@/components/app-shell/app-header";
import {
  useApplyTheme,
  useSystemThemeListener,
  useThemeHydrated,
} from "@/lib/theme-store";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui-primitives/sidebar";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import {
  RightSidebarProvider,
  RightSidebarSlot,
} from "@/components/app-shell/right-sidebar-portal";
import { HeaderPortalProvider } from "@/components/app-shell/header-portal";

export interface MyRouterContext {
  queryClient: QueryClient;
  getTitle?: () => string;
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
    <SidebarProvider>
      <AppSidebar />
      <RightSidebarProvider>
        <SidebarInset>
          <HeaderPortalProvider>
            <AppHeader />
            <main className="px-4 py-8 sm:px-6">
              <Outlet />
            </main>
          </HeaderPortalProvider>
        </SidebarInset>
        <RightSidebarSlot className="hidden xl:block" />
      </RightSidebarProvider>
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
    </SidebarProvider>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});
