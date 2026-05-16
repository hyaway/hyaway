// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Link } from "@tanstack/react-router";
import {
  IconCaretRightFilled,
  IconPoint,
  IconPointFilled,
} from "@tabler/icons-react";
import { cva } from "class-variance-authority";
import { usePageGroupMetaByPageKey } from "../-hooks/use-page-group-meta";
import { HighlightedText } from "./pages-highlighted-text";
import type { VariantProps } from "class-variance-authority";
import { useGetPagesTreeQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { TouchTarget } from "@/components/ui-primitives/touch-target";
import { cn } from "@/lib/utils";

const pageGroupPathVariants = cva(
  "flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0.5",
  {
    variants: {
      size: {
        card: "text-xs/4",
        sidebar: "text-sm/5",
      },
    },
    defaultVariants: {
      size: "card",
    },
  },
);

const pageGroupPathDotVariants = cva("shrink-0 self-center", {
  variants: {
    size: {
      card: "size-4",
      sidebar: "size-5",
    },
  },
  defaultVariants: {
    size: "card",
  },
});

const pageGroupPathSeparatorVariants = cva(
  "text-muted-foreground shrink-0 self-center",
  {
    variants: {
      size: {
        card: "size-3",
        sidebar: "size-4",
      },
    },
    defaultVariants: {
      size: "card",
    },
  },
);

interface PageGroupPathProps {
  groupLabel?: string;
  stripeColorsByLevel?: Array<string | null>;
  className?: string;
  size?: VariantProps<typeof pageGroupPathVariants>["size"];
  linkSegmentsToPagesSearch?: boolean;
  getGroupLabelRef?: (index: number) => (el: HTMLSpanElement | null) => void;
  highlightQuery?: string;
  useCustomHighlight?: boolean;
}

export function PageGroupPath({
  groupLabel,
  stripeColorsByLevel = [],
  className,
  size = "card",
  linkSegmentsToPagesSearch = false,
  getGroupLabelRef,
  highlightQuery = "",
  useCustomHighlight = false,
}: PageGroupPathProps) {
  if (!groupLabel) {
    return null;
  }

  const groupSegments = groupLabel.split(" / ");

  return (
    <span className={cn(pageGroupPathVariants({ size }), className)}>
      {groupSegments.map((segment, segmentIndex) => {
        const dotColor = stripeColorsByLevel[segmentIndex];

        return (
          <span
            key={`${segment}-${segmentIndex}`}
            className="flex items-center gap-0.5"
          >
            {dotColor ? (
              <IconPointFilled
                className={pageGroupPathDotVariants({ size })}
                style={{ color: dotColor }}
                aria-hidden="true"
              />
            ) : (
              <IconPoint
                className={cn(
                  "text-muted-foreground",
                  pageGroupPathDotVariants({ size }),
                )}
                aria-hidden="true"
              />
            )}
            {linkSegmentsToPagesSearch ? (
              <Link
                to="/pages"
                search={{ q: segment }}
                className="relative min-w-0 break-all underline-offset-2 outline-hidden hover:underline focus-visible:underline"
              >
                <TouchTarget>
                  <HighlightedText
                    text={segment}
                    query={highlightQuery}
                    useCustomHighlight={useCustomHighlight}
                  />
                </TouchTarget>
              </Link>
            ) : (
              <span
                ref={getGroupLabelRef?.(segmentIndex)}
                className="min-w-0 break-all"
              >
                <HighlightedText
                  text={segment}
                  query={highlightQuery}
                  useCustomHighlight={useCustomHighlight}
                />
              </span>
            )}
            {segmentIndex < groupSegments.length - 1 ? (
              <IconCaretRightFilled
                className={pageGroupPathSeparatorVariants({ size })}
                aria-hidden="true"
              />
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

interface PageGroupPathForPageProps {
  pageKey: string;
  className?: string;
  size?: VariantProps<typeof pageGroupPathVariants>["size"];
  linkSegmentsToPagesSearch?: boolean;
}

export function PageGroupPathForPage({
  pageKey,
  className,
  size = "card",
  linkSegmentsToPagesSearch = false,
}: PageGroupPathForPageProps) {
  const { data: pagesTree } = useGetPagesTreeQuery();
  const groupMetaByPageKey = usePageGroupMetaByPageKey(pagesTree ?? null);
  const groupMeta = groupMetaByPageKey.get(pageKey);

  if (!groupMeta) {
    return null;
  }

  return (
    <PageGroupPath
      groupLabel={groupMeta.label}
      stripeColorsByLevel={groupMeta.stripeColorsByLevel}
      className={className}
      size={size}
      linkSegmentsToPagesSearch={linkSegmentsToPagesSearch}
    />
  );
}
