// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ComponentProps } from "react";
import {
  SELECTED_TAG_BADGE_CLASSNAME,
  useSelectedTagBadgeStyle,
} from "@/components/tag/tag-badge-selection";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
import { cn } from "@/lib/utils";

type SearchSortTagProps = {
  label: string;
  color?: string;
  selected?: boolean;
  className?: string;
  size?: ComponentProps<typeof TagBadgeFromString>["size"];
  style?: ComponentProps<typeof TagBadgeFromString>["style"];
};

export function SearchSortTag({
  label,
  color,
  selected = false,
  className,
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

  return (
    <TagBadgeFromString
      displayTag={label}
      size={size}
      className={cn(className, selected && SELECTED_TAG_BADGE_CLASSNAME)}
      style={combinedStyle}
    />
  );
}
