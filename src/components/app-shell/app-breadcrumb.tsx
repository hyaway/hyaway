// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  Link,
  useCanGoBack,
  useMatches,
  useRouter,
} from "@tanstack/react-router";
import { Fragment } from "react";
import { IconArrowLeft } from "@tabler/icons-react";

import type { MyRouterContext } from "@/routes/__root";
import { Button } from "@/components/ui-primitives/button";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui-primitives/breadcrumb";

function formatBreadcrumbTitle(title: string) {
  return title.length === 64
    ? title.slice(0, 3) + "..." + title.slice(-4)
    : title;
}

export function AppBreadcrumb() {
  const matches = useMatches();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  // Filter routes that define their own getTitle (not inherited from parent)
  // by comparing the getTitle function reference to the previous match's
  const breadcrumbs: Array<{
    title: string;
    mobileTitle?: string;
    path: string;
  }> = [];
  let prevGetTitle: (() => string) | undefined;
  let prevGetMobileTitle: (() => string) | undefined;
  let useHistoryBack = false;

  for (const match of matches) {
    const context = match.context as MyRouterContext | undefined;
    const getTitle = context?.getTitle;
    const getMobileTitle = context?.getMobileTitle;

    // Only add if this route defines its own getTitle (different from parent's)
    if (getTitle && getTitle !== prevGetTitle) {
      breadcrumbs.push({
        title: getTitle(),
        mobileTitle:
          getMobileTitle && getMobileTitle !== prevGetMobileTitle
            ? getMobileTitle()
            : undefined,
        path: match.pathname,
      });
    }

    // Track if current route wants history-based back navigation
    if (context?.useHistoryBack) {
      useHistoryBack = true;
    }

    prevGetTitle = getTitle;
    prevGetMobileTitle = getMobileTitle;
  }

  // Get parent breadcrumb (second to last) for the up button
  const parentCrumb =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  // For routes with useHistoryBack, use browser history if available
  const shouldUseHistoryBack = useHistoryBack && canGoBack;
  const currentCrumb =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

  return (
    <div className="@container min-w-0 flex-1">
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap truncate">
          {/* Up button - goes to parent route or back in history */}
          {(shouldUseHistoryBack || parentCrumb) && (
            <>
              <BreadcrumbItem>
                {shouldUseHistoryBack ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Go back"
                    className="@md:hidden"
                    onClick={() => router.history.back()}
                  >
                    <IconArrowLeft />
                  </Button>
                ) : (
                  parentCrumb && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Go to ${parentCrumb.title}`}
                      className="@md:hidden"
                      render={<Link to={parentCrumb.path} />}
                      nativeButton={false}
                    >
                      <IconArrowLeft />
                    </Button>
                  )
                )}
              </BreadcrumbItem>
            </>
          )}
          {/* Full breadcrumb trail - hidden on mobile */}
          {breadcrumbs.slice(0, -1).map((crumb) => (
            <Fragment key={crumb.path}>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to={crumb.path} />}
                  className="hidden @md:block"
                >
                  <TouchTarget>{crumb.title}</TouchTarget>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden @md:block" />
            </Fragment>
          ))}
          {/* Current page */}
          {currentCrumb && (
            <BreadcrumbItem>
              <BreadcrumbPage>
                {currentCrumb.mobileTitle &&
                currentCrumb.mobileTitle !== currentCrumb.title ? (
                  <>
                    <span className="@md:hidden">
                      {formatBreadcrumbTitle(currentCrumb.mobileTitle)}
                    </span>
                    <span className="hidden @md:inline">
                      {formatBreadcrumbTitle(currentCrumb.title)}
                    </span>
                  </>
                ) : (
                  formatBreadcrumbTitle(currentCrumb.title)
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
