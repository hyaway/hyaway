// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Fragment } from "react";
import type { ComponentProps } from "react";
import type { SortConfig } from "@/stores/search-defaults";
import { Badge } from "@/components/ui-primitives/badge";
import {
  SELECTED_TAG_BADGE_CLASSNAME,
  useSelectedTagBadgeStyle,
} from "@/components/tag/tag-badge-selection";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";
import { cn } from "@/lib/utils";
import { isNamespaceSortConfig } from "@/stores/search-defaults";

function getNamespaceTokenColor(
  namespaceColors: Record<string, string>,
  namespace: string,
): string {
  return (
    namespaceColors[namespace] || namespaceColors.null || "var(--foreground)"
  );
}

type NamespaceSortBadgeSize = ComponentProps<typeof Badge>["size"];
type NamespaceSortBadgeStyle = ComponentProps<typeof Badge>["style"];

export function NamespaceSortBadge({
  namespaces,
  sortAsc,
  showLabel,
  showOrder,
  compact,
  className,
  style,
  size,
}: {
  namespaces: Array<string>;
  sortAsc?: boolean;
  showLabel?: boolean;
  showOrder?: boolean;
  compact?: boolean;
  className?: string;
  style?: NamespaceSortBadgeStyle;
  size?: NamespaceSortBadgeSize;
}) {
  const namespaceColors = useNamespaceColors();
  const orderLabel = sortAsc ? "a-z" : "z-a";
  const baseStyle = {
    "--badge-overlay":
      namespaceColors[""] || namespaceColors.null || "var(--foreground)",
    ...style,
  };
  const parts = [
    ...(showLabel
      ? [{ kind: "label" as const, text: "Sort by namespaces:" }]
      : []),
    ...namespaces.map((namespace) => ({
      kind: "namespace" as const,
      text: namespace,
    })),
    ...(showOrder ? [{ kind: "order" as const, text: `(${orderLabel})` }] : []),
  ];

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center">
      {parts.map((part, index) => {
        const isFirst = index === 0;
        const isLast = index === parts.length - 1;
        const badgeStyle =
          part.kind === "namespace"
            ? {
                "--badge-overlay": getNamespaceTokenColor(
                  namespaceColors,
                  part.text,
                ),
                ...style,
              }
            : baseStyle;

        return (
          <Fragment key={`${index}:${part.kind}:${part.text}`}>
            <Badge
              variant="overlay"
              size={size}
              style={badgeStyle}
              className={cn(
                compact
                  ? "h-6 rounded-md px-1.5 text-xs"
                  : "border-foreground/40 rounded-b-none border-y-2",
                !compact && isFirst && "border-l-2",
                !compact && isLast && "border-r-2",
                className,
              )}
            >
              {part.text}
            </Badge>
          </Fragment>
        );
      })}
    </span>
  );
}

type SearchSortTagProps = {
  label: string;
  sort?: SortConfig;
  color?: string;
  selected?: boolean;
  className?: string;
  badgeClassName?: string;
  size?: ComponentProps<typeof TagBadgeFromString>["size"];
  style?: ComponentProps<typeof TagBadgeFromString>["style"];
};

export function SearchSortTag({
  label,
  sort,
  color,
  selected = false,
  className,
  badgeClassName,
  size = "default-wrap",
  style,
}: SearchSortTagProps) {
  const selectedStyle = useSelectedTagBadgeStyle();
  const sortStyle = color
    ? ({ "--badge-overlay": color } as ComponentProps<
        typeof TagBadgeFromString
      >["style"])
    : undefined;
  const combinedStyle = {
    ...sortStyle,
    ...style,
    ...(selected ? selectedStyle : undefined),
  };

  if (sort && isNamespaceSortConfig(sort)) {
    const selectedClassName = selected
      ? SELECTED_TAG_BADGE_CLASSNAME
      : undefined;

    return (
      <span
        className={cn(
          "inline-flex flex-wrap items-center select-auto",
          selectedClassName,
          className,
        )}
      >
        <NamespaceSortBadge
          namespaces={sort.namespaces}
          sortAsc={sort.sortAsc}
          showLabel
          showOrder
          size={size}
          style={combinedStyle}
          className={badgeClassName}
        />
      </span>
    );
  }

  return (
    <TagBadgeFromString
      displayTag={label}
      size={size}
      className={cn(className, selected && SELECTED_TAG_BADGE_CLASSNAME)}
      style={combinedStyle}
    />
  );
}
