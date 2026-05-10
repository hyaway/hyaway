// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { TouchTarget } from "../ui-primitives/touch-target";
import type { badgeVariants } from "@/components/ui-primitives/badge";
import type { VariantProps } from "class-variance-authority";
import type { CSSProperties, ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui-primitives/badge";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";

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
 * A badge for displaying an OR group of tags, each with its own namespace color.
 */
export function OrTagBadge({ tags }: { tags: Array<string> }) {
  const namespaceColors = useNamespaceColors();
  return (
    <Badge variant="secondary" className="gap-1 select-auto">
      {tags.map((t, i) => {
        const { namespace, tag, negated } = parseTag(t);
        const color =
          namespaceColors[namespace || "null"] ||
          namespaceColors["null"] ||
          "var(--foreground)";
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="text-muted-foreground px-1 text-sm">or</span>
            )}
            <span style={{ color }} className="select-all">
              {negated ? "-" : ""}
              {namespace ? `${namespace}: ` : ""}
              {tag}
            </span>
          </span>
        );
      })}
    </Badge>
  );
}
