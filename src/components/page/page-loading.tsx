import type { ReactNode } from "react";
import { ImageGridSkeleton } from "@/components/image-grid/image-grid-skeleton";
import { PageHeading } from "@/components/page/page-heading";
import { Separator } from "@/components/ui-primitives/separator";
import { Skeleton } from "@/components/ui-primitives/skeleton";

interface PageLoadingProps {
  title: string;
  children?: ReactNode;
  buttonCount?: number;
}

export function PageLoading({
  title,
  children,
  buttonCount,
}: PageLoadingProps) {
  return (
    <div>
      {title && <PageHeading title={title} />}
      {children}
      {buttonCount && buttonCount > 0 && (
        <>
          <div className="flex gap-2">
            {Array.from({ length: buttonCount }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" />
            ))}
          </div>
          <Separator className="my-2" />
        </>
      )}
      <ImageGridSkeleton />
    </div>
  );
}
