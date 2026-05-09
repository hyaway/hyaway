// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { PageHeading } from "./page-heading";
import type { ReactNode } from "react";
import { ThumbnailGallerySkeleton } from "@/components/thumbnail-gallery/thumbnail-gallery-skeleton";

interface PageLoadingProps {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}

export function PageLoading({ title, eyebrow, children }: PageLoadingProps) {
  return (
    <div className="pb-16">
      {title && <PageHeading title={title} eyebrow={eyebrow} />}
      {children}
      <ThumbnailGallerySkeleton />
    </div>
  );
}
