// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTagStarred } from "@tabler/icons-react";
import { TouchTarget } from "../ui-primitives/touch-target";
import type { badgeVariants } from "@/components/ui-primitives/badge";
import type { VariantProps } from "class-variance-authority";
import type { CSSProperties, ComponentProps, ReactNode } from "react";

import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import { Badge } from "@/components/ui-primitives/badge";
import { useFavouriteTagsLookup } from "@/integrations/hydrus-api/queries/tags";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";

import { TagActionMenu, TagActionTrigger } from "@/components/tag/tag-actions";

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

  const favourites = useFavouriteTagsLookup();
  const fullTag = namespace ? `${namespace}:${tag}` : tag;
  const isFavourite = favourites.has(fullTag);

  return (
    <Badge
      variant={"overlay"}
      className={className}
      style={combinedStyle}
      {...props}
    >
      <TouchTarget>
        {negated ? "-" : ""}
        {namespace ? `${namespace}: ` : ""}
        {tag}
      </TouchTarget>
      {isFavourite && <IconTagStarred className="size-5! shrink-0" />}
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
        "ms-1 -me-0.5 shrink-0 border border-(--badge-overlay)/30 px-1.5",
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
  interactive,
}: {
  tags: Array<string>;
  className?: string;
  size?: "default" | "default-wrap";
  interactive?: boolean;
}) {
  return (
    <>
      {tags.map((t, i) => {
        const isFirst = i === 0;
        const isLast = i === tags.length - 1;
        const badge = (
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
        );
        return (
          <>
            {i > 0 && (
              <span className="text-muted-foreground border-foreground/40 -mx-1.5 inline-flex h-11 items-center border-y-2 px-1.5 text-sm font-medium">
                or
              </span>
            )}
            {interactive ? (
              <TagActionTrigger key={i} tag={t} className="inline-flex">
                {badge}
              </TagActionTrigger>
            ) : (
              <span key={i} className="inline-flex">
                {badge}
              </span>
            )}
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
 * When `interactive` is true, each tag is a button that opens an action menu.
 */
export function SearchTagList({
  tags,
  sortLabel,
  interactive = true,
  className,
}: {
  tags: HydrusTagSearch;
  sortLabel?: string;
  /** When false, tags are plain text with no menu. Useful inside links. */
  interactive?: boolean;
  className?: string;
}) {
  const content = (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((entry, i) =>
        Array.isArray(entry) ? (
          <OrTagBadge
            key={i}
            tags={entry}
            interactive={interactive}
            size="default-wrap"
          />
        ) : interactive ? (
          <TagActionTrigger key={i} tag={entry}>
            <TagBadgeFromString displayTag={entry} size="default-wrap" />
          </TagActionTrigger>
        ) : (
          <TagBadgeFromString key={i} displayTag={entry} size="default-wrap" />
        ),
      )}
      {sortLabel && (
        <TagBadgeFromString displayTag={sortLabel} size="default-wrap" />
      )}
    </div>
  );

  if (!interactive) return content;

  return <TagActionMenu>{content}</TagActionMenu>;
}
