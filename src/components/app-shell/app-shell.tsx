"use client";

import * as React from "react";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { FloatingFooter } from "./floating-footer";
import { FloatingHeader } from "./floating-header";
import { FooterPortalProvider, FooterPortalSlot } from "./footer-portal";
import { RightSidebarProvider } from "./right-sidebar-portal";
import { RightSidebar } from "./right-sidebar";
import { Sidebar, SidebarLayout } from "@/components/ui-primitives/sidebar";
import { Toaster } from "@/components/ui-primitives/sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout>
      {/* Full-height left sidebar (uses fixed positioning internally) */}
      <Sidebar side="left" collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <RightSidebarProvider>
        {/* Center column: header + content + floating footer - uses page scroll */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Floating header - sticky with hide on scroll */}
          <FloatingHeader>
            <AppHeader />
          </FloatingHeader>

          {/* Content area - grows naturally, page scrolls */}
          <FooterPortalProvider>
            <main
              className={`short:pb-(--footer-height-short) mx-4 flex-1 overflow-x-clip py-2 pb-(--footer-height) sm:mx-6 lg:pb-(--footer-height-sm)`}
            >
              {children}
            </main>

            {/* Floating footer - sticky at bottom of center column */}
            <FloatingFooter className="justify-center">
              <FooterPortalSlot />
            </FloatingFooter>
          </FooterPortalProvider>
        </div>

        {/* Full-height right sidebar - fixed position */}
        <RightSidebar />
      </RightSidebarProvider>

      {/* Global toast notifications */}
      <Toaster />
    </SidebarLayout>
  );
}
