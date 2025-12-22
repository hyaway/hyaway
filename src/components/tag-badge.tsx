import { Badge } from "@/components/ui-primitives/badge";
import { parseTag } from "@/lib/tag-utils";
import { cn } from "@/lib/utils";

/**
 * A badge component for displaying a tag with optional namespace.
 */
export function TagBadge({
  tag,
  namespace,
  className,
}: {
  tag: string;
  namespace?: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("select-all", className)}>
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
  className,
}: {
  displayTag: string;
  className?: string;
}) {
  const { namespace, tag } = parseTag(displayTag);
  return <TagBadge tag={tag} namespace={namespace} className={className} />;
}
