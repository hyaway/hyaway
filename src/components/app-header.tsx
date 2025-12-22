import { Link, useMatches } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";

import { TouchTarget } from "./ui-primitives/touch-target";
import type { MyRouterContext } from "@/routes/__root";
import { HeaderPortalSlot } from "@/components/header-portal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui-primitives/breadcrumb";
import { Separator } from "@/components/ui-primitives/separator";
import { SidebarTrigger } from "@/components/ui-primitives/sidebar";
import { cn } from "@/lib/utils";

// Custom event for scroll restoration
export const SCROLL_RESTORATION_EVENT = "app:scroll-restoration";

export function dispatchScrollRestoration() {
  window.dispatchEvent(new CustomEvent(SCROLL_RESTORATION_EVENT));
}

function useScrollDirection(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const skipNextScroll = useRef(false);

  useEffect(() => {
    // Initialize with current scroll position
    lastScrollY.current = window.scrollY;

    const handleScrollRestoration = () => {
      // Skip the next scroll event and keep header visible
      skipNextScroll.current = true;
      setIsVisible(true);
      // Update lastScrollY to prevent hiding on next scroll
      lastScrollY.current = window.scrollY;
    };

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      // Skip if scroll restoration just happened
      if (skipNextScroll.current) {
        skipNextScroll.current = false;
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      // Ignore if only horizontal scroll occurred
      if (scrollY === lastScrollY.current) {
        ticking.current = false;
        return;
      }

      // Always show header when at the top
      if (scrollY < threshold) {
        setIsVisible(true);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const diff = scrollY - lastScrollY.current;

      // Only update if scroll difference exceeds threshold (reduces jitter)
      if (Math.abs(diff) >= threshold) {
        setIsVisible(diff < 0); // Scrolling up = visible
        lastScrollY.current = scrollY;
      }

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(SCROLL_RESTORATION_EVENT, handleScrollRestoration);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(
        SCROLL_RESTORATION_EVENT,
        handleScrollRestoration,
      );
    };
  }, [threshold]);

  return isVisible;
}

export function AppHeader() {
  const matches = useMatches();
  const isVisible = useScrollDirection(50);

  // Filter routes that define their own getTitle (not inherited from parent)
  // by comparing the getTitle function reference to the previous match's
  const breadcrumbs: Array<{ title: string; path: string }> = [];
  let prevGetTitle: (() => string) | undefined;

  for (const match of matches) {
    const context = match.context as MyRouterContext | undefined;
    const getTitle = context?.getTitle;

    // Only add if this route defines its own getTitle (different from parent's)
    if (getTitle && getTitle !== prevGetTitle) {
      breadcrumbs.push({
        title: getTitle(),
        path: match.pathname,
      });
    }

    prevGetTitle = getTitle;
  }

  return (
    <header
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 flex shrink-0 flex-col backdrop-blur-sm transition-all duration-300 ease-in-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="my-auto mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink render={<Link to="/" />}>
                <TouchTarget>hyAway</TouchTarget>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.length > 0 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <Fragment key={crumb.path}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link to={crumb.path} />}
                        className="hidden md:block"
                      >
                        <TouchTarget>{crumb.title}</TouchTarget>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <HeaderPortalSlot className="px-4" />
      {/* Prevent accidental hover interactions for zoom */}
      <div aria-hidden="true" className="absolute top-full left-0 h-2 w-full" />
    </header>
  );
}
