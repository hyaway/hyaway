import type { badgeVariants } from "@/components/ui-primitives/badge";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui-primitives/badge";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

type BadgeProps = ComponentProps<typeof Badge> &
  VariantProps<typeof badgeVariants>;

/**
 * A badge component for displaying a tag with optional namespace.
 */
export function TagBadge({
  tag,
  namespace,
  variant = "outline",
  children,
  ...props
}: {
  tag: string;
  namespace?: string;
  children?: ReactNode;
} & BadgeProps) {
  return (
    <Badge variant={variant} {...props}>
      <span className="select-all">
        {namespace ? `${namespace}: ` : ""}
        {tag}
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
      variant="outline"
      size="xs"
      className={cn("ms-1 -me-0.5 shrink-0 px-1.5 select-all", className)}
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
  const { namespace, tag } = parseTag(displayTag);
  return <TagBadge tag={tag} namespace={namespace} {...props} />;
}
