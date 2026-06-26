// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import { PageFloatingFooter } from "@/components/page-shell/page-floating-footer";
import { useReviewActions } from "@/hooks/use-review-actions";

interface ThumbnailGalleryFloatingFooterProps {
  actions?: Array<FloatingFooterAction>;
  leftContent?: ReactNode;
  className?: string;
}

export function ThumbnailGalleryFloatingFooter({
  actions = [],
  leftContent,
  className,
}: ThumbnailGalleryFloatingFooterProps) {
  const reviewActions = useReviewActions();

  return (
    <PageFloatingFooter
      leftContent={leftContent}
      actions={[...reviewActions, ...actions]}
      className={className}
    />
  );
}
