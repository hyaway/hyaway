// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { TouchTarget } from "../ui-primitives/touch-target";
import type { badgeVariants } from "@/components/ui-primitives/badge";
import type { VariantProps } from "class-variance-authority";
import type { CSSProperties, ComponentProps, ReactNode } from "react";

import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import { Badge } from "@/components/ui-primitives/badge";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";

import { TagListContextMenu } from "@/components/tag/tag-actions";

type BadgeProps = ComponentProps<typeof Badge> &
  VariantProps<typeof badgeVariants>;

/**
 * A badge component for displaying a tag with optional namespace.
 * Automatically applies color from Hydrus client options based on namespace.
 */
export function TagBadge({
  tag,
  namespace,
  negated,
  variant,
  children,
  className,
  style,
  ...props
}: {
  tag: string;
  namespace?: string;
  negated?: boolean;
  children?: ReactNode;
} & BadgeProps) {
  const namespaceColors = useNamespaceColors();
  const color =
    namespaceColors[namespace ?? ""] ||
    namespaceColors["null"] ||
    "var(--foreground)";

  const combinedStyle: CSSProperties = {
    "--badge-overlay": color,
    ...style,
  };

  return (
    <Badge
      variant={"overlay"}
      className={cn("select-auto", className)}
      style={combinedStyle}
      {...props}
    >
      <span className="select-all">
        <TouchTarget>
          {negated ? "-" : ""}
          {namespace ? `${namespace}: ` : ""}
          {tag}
        </TouchTarget>
      </span>
      {children}
    </Badge>
  );
}

/**
 * A count component to display inside TagBadge.
 */
function TagBadgeCount({
  children,
  className,
  ...props
}: ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="overlay"
      size="xs"
      className={cn(
        "ms-1 -me-0.5 shrink-0 border border-(--badge-overlay)/30 px-1.5 select-all",
        className,
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}

TagBadge.Count = TagBadgeCount;

/**
 * A badge component for displaying a raw tag string (will be parsed).
 */
export function TagBadgeFromString({
  displayTag,
  ...props
}: {
  displayTag: string;
} & Omit<BadgeProps, "tag" | "namespace">) {
  const { namespace, tag, negated } = parseTag(displayTag);
  return (
    <TagBadge tag={tag} namespace={namespace} negated={negated} {...props} />
  );
}

/**
 * Renders an OR group as individual tag badges separated by "or" labels,
 * each with a bottom border that connects into one continuous line.
 */
export function OrTagBadge({
  tags,
  className,
  size,
}: {
  tags: Array<string>;
  className?: string;
  size?: "default" | "default-wrap";
}) {
  return (
    <>
      {tags.map((t, i) => {
        const isFirst = i === 0;
        const isLast = i === tags.length - 1;
        return (
          <>
            {i > 0 && (
              <span className="text-muted-foreground border-foreground/40 -mx-1.5 inline-flex h-11 items-center border-y-2 px-1.5 text-sm font-medium">
                or
              </span>
            )}
            <span key={i} data-tag={t} className="inline-flex">
              <TagBadgeFromString
                displayTag={t}
                size={size}
                className={cn(
                  "border-foreground/40 rounded-b-none border-y-2",
                  isFirst && "border-l-2",
                  isLast && "border-r-2",
                  className,
                )}
              />
            </span>
          </>
        );
      })}
    </>
  );
}

/**
 * Renders a list of hydrus search tags as badges.
 * Handles both plain tags and OR groups.
 * Optionally displays a sort label as an additional badge.
 * Wraps in a context menu with "New search" and favourite actions.
 */
export function SearchTagList({
  tags,
  sortLabel,
}: {
  tags: HydrusTagSearch;
  sortLabel?: string;
}) {
  const content = (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((entry, i) =>
        Array.isArray(entry) ? (
          <OrTagBadge key={i} tags={entry} size="default-wrap" />
        ) : (
          <span key={i} data-tag={entry}>
            <TagBadgeFromString displayTag={entry} size="default-wrap" />
          </span>
        ),
      )}
      {sortLabel && (
        <TagBadgeFromString displayTag={sortLabel} size="default-wrap" />
      )}
    </div>
  );

  return <TagListContextMenu>{content}</TagListContextMenu>;
}
