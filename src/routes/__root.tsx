import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import type { QueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { useApplyTheme, useSystemThemeListener } from "@/lib/theme-store";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui-primitives/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  RightSidebarProvider,
  RightSidebarSlot,
} from "@/components/right-sidebar-portal";

export interface MyRouterContext {
  queryClient: QueryClient;
  getTitle?: () => string;
}

function RootComponent() {
  useApplyTheme();
  useSystemThemeListener();
  return (
    <RightSidebarProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <Outlet />
        </SidebarInset>
        <RightSidebarSlot className="hidden xl:block" />
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
    </RightSidebarProvider>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});
