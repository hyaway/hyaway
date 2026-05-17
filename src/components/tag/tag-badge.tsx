// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTagStarred } from "@tabler/icons-react";
import { Fragment, useMemo } from "react";
import { TouchTarget } from "../ui-primitives/touch-target";
import type { badgeVariants } from "@/components/ui-primitives/badge";
import type { RovingTagActionTriggerProps } from "@/components/tag/tag-list-focus";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import { Badge } from "@/components/ui-primitives/badge";
import { useNamespaceColor } from "@/integrations/hydrus-api/queries/options";
import { useIsFavouriteTag } from "@/integrations/hydrus-api/queries/tags";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

import {
  TagActionMenu,
  TagActionTrigger,
  isSystemTag,
} from "@/components/tag/tag-actions";
import { useRovingTagActionTriggers } from "@/components/tag/tag-list-focus";

type BadgeProps = ComponentProps<typeof Badge> &
  VariantProps<typeof badgeVariants>;
type BadgeSize = NonNullable<BadgeProps["size"]>;

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
  labelClassName,
  style,
  ...props
}: {
  tag: string;
  namespace?: string;
  negated?: boolean;
  children?: ReactNode;
  labelClassName?: string;
} & BadgeProps) {
  const color = useNamespaceColor(namespace);
  const combinedStyle = { "--badge-overlay": color, ...style };

  const fullTag = namespace ? `${namespace}:${tag}` : tag;
  const isFavourite = useIsFavouriteTag(fullTag);

  return (
    <Badge
      variant={"overlay"}
      className={cn("select-auto", className)}
      style={combinedStyle}
      {...props}
    >
      <TouchTarget>
        <span className={labelClassName}>
          {negated ? "-" : ""}
          {namespace ? (
            <>
              <span className="whitespace-nowrap">{namespace}:</span>{" "}
            </>
          ) : null}
          {tag}
        </span>
      </TouchTarget>
      <div className="flex flex-wrap items-center gap-1">
        {isFavourite && <IconTagStarred className="size-5! shrink-0" />}
        {children}
      </div>
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

export function TagActionBadge({
  displayTag,
  triggerClassName,
  triggerProps,
  ...badgeProps
}: {
  displayTag: string;
  triggerClassName?: string;
  triggerProps?: RovingTagActionTriggerProps;
} & Omit<ComponentProps<typeof TagBadgeFromString>, "displayTag">) {
  return (
    <TagActionTrigger
      tag={displayTag}
      className={triggerClassName}
      {...(triggerProps ?? {})}
    >
      <TagBadgeFromString displayTag={displayTag} {...badgeProps} />
    </TagActionTrigger>
  );
}

/**
 * Renders an OR group as individual tag badges separated by "or" labels,
 * each with a bottom border that connects into one continuous line.
 */
export function OrTagBadge({
  tags,
  className,
  separatorClassName,
  style,
  size,
  interactive,
  getInteractiveTriggerProps,
}: {
  tags: Array<string>;
  className?: string;
  separatorClassName?: string;
  style?: ComponentProps<typeof TagBadgeFromString>["style"];
  size?: BadgeSize;
  interactive?: boolean;
  getInteractiveTriggerProps?: (index: number) => RovingTagActionTriggerProps;
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
            style={style}
            className={cn(
              "border-foreground/40 rounded-b-none border-y-2",
              isFirst && "border-l-2",
              isLast && "border-r-2",
              className,
            )}
          />
        );
        return (
          <Fragment key={`${i}:${t}`}>
            {i > 0 && (
              <span
                style={style}
                className={cn(
                  "text-muted-foreground border-foreground/40 -mx-1.5 inline-flex h-11 items-center border-y-2 px-1.5 text-sm font-medium",
                  style && "border-(--badge-overlay)",
                  size === "compact-mobile-wrap" &&
                    "max-sm:h-9 max-sm:px-1 max-sm:text-xs",
                  separatorClassName,
                )}
              >
                or
              </span>
            )}
            {interactive ? (
              <TagActionBadge
                displayTag={t}
                size={size}
                style={style}
                className={cn(
                  "border-foreground/40 rounded-b-none border-y-2",
                  isFirst && "border-l-2",
                  isLast && "border-r-2",
                  className,
                )}
                triggerClassName="inline-flex"
                triggerProps={getInteractiveTriggerProps?.(i)}
              />
            ) : (
              <span className="inline-flex">{badge}</span>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * Renders a list of hydrus search tags as badges.
 * Handles both plain tags and OR groups.
 * When `interactive` is true, each tag is a button that opens an action menu.
 */
export function SearchTagList({
  tags,
  children,
  interactive = true,
  className,
  badgeClassName,
  orSeparatorClassName,
  badgeSize = "compact-mobile-wrap",
}: {
  tags: HydrusTagSearch;
  children?: ReactNode;
  /** When false, tags are plain text with no menu. Useful inside links. */
  interactive?: boolean;
  className?: string;
  badgeClassName?: string;
  orSeparatorClassName?: string;
  badgeSize?: BadgeSize;
}) {
  const interactiveDisplayTags = useMemo(() => {
    if (!interactive) return [];
    return tags.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
  }, [interactive, tags]);

  const enabledInteractiveIndices = useMemo(
    () =>
      interactiveDisplayTags.flatMap((tag, index) =>
        isSystemTag(tag) ? [] : [index],
      ),
    [interactiveDisplayTags],
  );

  const rovingTriggers = useRovingTagActionTriggers({
    itemCount: interactiveDisplayTags.length,
    enabledIndices: enabledInteractiveIndices,
  });

  const interactiveTagIndices = useMemo(() => {
    let nextIndex = 0;

    return tags.map((entry) => {
      if (Array.isArray(entry)) {
        return entry.map(() => nextIndex++);
      }

      return nextIndex++;
    });
  }, [tags]);

  const content = (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((entry, i) =>
        Array.isArray(entry) ? (
          <OrTagBadge
            key={i}
            tags={entry}
            interactive={interactive}
            size={badgeSize}
            className={badgeClassName}
            separatorClassName={orSeparatorClassName}
            getInteractiveTriggerProps={(orIndex) => {
              const actionIndices = interactiveTagIndices[i];
              return rovingTriggers.getTriggerProps(
                Array.isArray(actionIndices) ? actionIndices[orIndex] : 0,
              );
            }}
          />
        ) : interactive ? (
          <TagActionBadge
            key={i}
            displayTag={entry}
            size={badgeSize}
            className={badgeClassName}
            triggerProps={rovingTriggers.getTriggerProps(
              typeof interactiveTagIndices[i] === "number"
                ? interactiveTagIndices[i]
                : 0,
            )}
          />
        ) : (
          <TagBadgeFromString
            key={i}
            displayTag={entry}
            size={badgeSize}
            className={badgeClassName}
          />
        ),
      )}
      {children}
    </div>
  );

  if (!interactive) return content;

  return <TagActionMenu>{content}</TagActionMenu>;
}
