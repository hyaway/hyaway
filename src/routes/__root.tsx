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
import { SidebarProvider } from "@/components/ui-primitives/sidebar";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import {
  RightSidebarProvider,
  RightSidebarSlot,
} from "@/components/app-shell/right-sidebar-portal";
import {
  FooterPortalProvider,
  FooterPortalSlot,
} from "@/components/app-shell/footer-portal";
import { FloatingFooter } from "@/components/app-shell/floating-footer";
import { FloatingHeader } from "@/components/app-shell/floating-header";

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
      {/* Full-height left sidebar (uses fixed positioning internally) */}
      <AppSidebar />

      <RightSidebarProvider>
        {/* Center column: header + content + floating footer - uses page scroll */}
        {/* lg:mr-64 accounts for fixed right sidebar width */}
        <div className="relative flex min-w-0 flex-1 flex-col lg:mr-64">
          {/* Floating header - sticky with hide on scroll */}
          <FloatingHeader className="border-b">
            <AppHeader />
          </FloatingHeader>

          {/* Content area - grows naturally, page scrolls */}
          <FooterPortalProvider>
            <main className="short:py-2 flex-1 px-4 py-4 sm:px-6 sm:py-8">
              <Outlet />
            </main>

            {/* Floating footer - sticky at bottom of center column */}
            <FloatingFooter className="sticky bottom-0 justify-center">
              <FooterPortalSlot />
            </FloatingFooter>
          </FooterPortalProvider>
        </div>

        {/* Full-height right sidebar - fixed position */}
        <RightSidebarSlot className="bg-sidebar fixed inset-y-0 right-0 z-10 hidden w-64 overflow-y-auto border-l lg:block" />
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
