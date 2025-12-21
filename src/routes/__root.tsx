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

interface MyRouterContext {
  queryClient: QueryClient;
}

function RootComponent() {
  useApplyTheme();
  useSystemThemeListener();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <Outlet />
      </SidebarInset>
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
