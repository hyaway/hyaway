import {
  Link,
  useCanGoBack,
  useMatchRoute,
  useMatches,
  useRouter,
} from "@tanstack/react-router";
import { Fragment } from "react";

import type { MyRouterContext } from "@/routes/__root";
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
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const matchRoute = useMatchRoute();

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

  const isFilePage = matchRoute({ to: "/file/$fileId" }) && canGoBack;

  return (
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
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
