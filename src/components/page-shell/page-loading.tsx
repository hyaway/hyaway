import { PageHeading } from "./page-heading";
import type { ReactNode } from "react";
import { ThumbnailGallerySkeleton } from "@/components/thumbnail-gallery/thumbnail-gallery-skeleton";

interface PageLoadingProps {
  title: string;
  children?: ReactNode;
}

export function PageLoading({ title, children }: PageLoadingProps) {
  return (
    <div className="pb-16">
      {title && <PageHeading title={title} />}
      {children}
      <ThumbnailGallerySkeleton />
    </div>
  );
}
