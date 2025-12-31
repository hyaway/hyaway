import { useCanGoBack, useRouter } from "@tanstack/react-router";

import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "../ui-primitives/button";
import { AppBreadcrumb } from "@/components/app-shell/app-breadcrumb";
import { HeaderPortalSlot } from "@/components/app-shell/header-portal";
import { Separator } from "@/components/ui-primitives/separator";
import { SidebarTrigger } from "@/components/ui-primitives/sidebar";
import { cn } from "@/lib/utils";
import {
  SCROLL_RESTORATION_EVENT,
  dispatchScrollRestoration,
  useScrollDirection,
} from "@/hooks/use-scroll-direction";

// Re-export for backwards compatibility
export { SCROLL_RESTORATION_EVENT, dispatchScrollRestoration };

export function AppHeader() {
  const isVisible = useScrollDirection(50);
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <header
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/75 sticky top-0 z-40 flex shrink-0 flex-col backdrop-blur-sm transition-all duration-200 ease-out",
        // Extended area below header for hover detection - always interactive
        "after:pointer-events-auto after:absolute after:inset-x-0 after:top-full after:content-['']",
        isVisible
          ? "translate-y-0 opacity-100 after:h-2"
          : "short:after:h-10 pointer-events-none -translate-y-full opacity-0 after:h-10 hover:pointer-events-auto hover:translate-y-0 hover:opacity-100 sm:after:h-14",
      )}
    >
      <div className="short:h-10 flex h-10 shrink-0 items-center gap-2 px-4 sm:h-14">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="my-auto mr-2 data-[orientation=vertical]:h-4"
        />
        {canGoBack && (
          <Button
            onClick={() => router.history.back()}
            variant="ghost"
            size="icon"
            aria-label="Go back"
            className={"md:hidden"}
          >
            <IconArrowLeft className="size-5" />
          </Button>
        )}
        <AppBreadcrumb />
      </div>
      <HeaderPortalSlot className="px-4" />
    </header>
  );
}
