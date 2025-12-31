import { Link, useMatches } from "@tanstack/react-router";
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

export function AppBreadcrumb() {
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

  // Get parent breadcrumb (second to last) for the up button
  const parentCrumb =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
  const currentCrumb =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Up button - goes to parent route */}
        {parentCrumb && (
          <>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Go to ${parentCrumb.title}`}
                className="md:hidden"
                render={<Link to={parentCrumb.path} />}
              >
                <IconArrowLeft className="size-5" />
              </Button>
            </BreadcrumbItem>
          </>
        )}
        {/* Full breadcrumb trail - hidden on mobile */}
        {breadcrumbs.slice(0, -1).map((crumb) => (
          <Fragment key={crumb.path}>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to={crumb.path} />}
                className="hidden md:block"
              >
                <TouchTarget>{crumb.title}</TouchTarget>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </Fragment>
        ))}
        {/* Current page */}
        {currentCrumb && (
          <BreadcrumbItem>
            <BreadcrumbPage>{currentCrumb.title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
