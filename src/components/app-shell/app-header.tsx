import {
  Link,
  useCanGoBack,
  useMatchRoute,
  useMatches,
  useRouter,
} from "@tanstack/react-router";
import { Fragment } from "react";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "../ui-primitives/button";
import type { MyRouterContext } from "@/routes/__root";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import { HeaderPortalSlot } from "@/components/app-shell/header-portal";
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
import {
  SCROLL_RESTORATION_EVENT,
  dispatchScrollRestoration,
  useScrollDirection,
} from "@/hooks/use-scroll-direction";

// Re-export for backwards compatibility
export { SCROLL_RESTORATION_EVENT, dispatchScrollRestoration };

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
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const matchRoute = useMatchRoute();
  const isFilePage = matchRoute({ to: "/file/$fileId" }) && canGoBack;

  return (
    <header
      className={cn(
        "bg-background/95 supports-backdrop-filter:bg-background/75 sticky top-0 z-40 flex shrink-0 flex-col backdrop-blur-sm transition-all duration-300 ease-out",
        // Extended area below header to prevent accidental hover interactions
        "after:absolute after:inset-x-0 after:top-full after:h-2 after:content-['']",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="max-h-short:h-10 flex h-10 shrink-0 items-center gap-2 px-4 sm:h-14">
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
            <ArrowLeftIcon className="size-5" />
          </Button>
        )}
        <Breadcrumb>
          <BreadcrumbList>
            {isFilePage && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => router.history.back()}
                    className="hidden cursor-pointer md:block"
                  >
                    <TouchTarget>Gallery</TouchTarget>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.length > 0 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </>
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
    </header>
  );
}
