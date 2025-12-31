import { PageHeading } from "./page-heading";
import type { ReactNode } from "react";
import { ImageGridSkeleton } from "@/components/image-grid/image-grid-skeleton";

interface PageLoadingProps {
  title: string;
  children?: ReactNode;
}

export function PageLoading({ title, children }: PageLoadingProps) {
  return (
    <div className="pb-16">
      {title && <PageHeading title={title} />}
      {children}
      <ImageGridSkeleton />
    </div>
  );
}
