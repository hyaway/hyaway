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
            <main className="flex-1 px-4 py-2 sm:px-6">{children}</main>

            {/* Floating footer - sticky at bottom of center column */}
            <FloatingFooter className="justify-center">
              <FooterPortalSlot />
            </FloatingFooter>
          </FooterPortalProvider>
        </div>

        {/* Full-height right sidebar - fixed position */}
        <RightSidebar />
      </RightSidebarProvider>
    </SidebarLayout>
  );
}
