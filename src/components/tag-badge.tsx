import type { badgeVariants } from "@/components/ui-primitives/badge";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

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
  className,
  variant = "outline",
  ...props
}: {
  tag: string;
  namespace?: string;
} & BadgeProps) {
  return (
    <Badge variant={variant} className={cn("select-all", className)} {...props}>
      {namespace ? `${namespace}: ` : ""}
      {tag}
    </Badge>
  );
}

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
