import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";

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

export function AppHeader() {
  const matches = useMatches();

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
    <header className="flex shrink-0 flex-col transition-[width,height] ease-linear">
      <div className="flex h-16 items-center gap-2 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink render={<Link to="/" />}>hyAway</BreadcrumbLink>
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
                          {crumb.title}
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
      </div>
      <HeaderPortalSlot className="px-4 py-2" />
    </header>
  );
}
