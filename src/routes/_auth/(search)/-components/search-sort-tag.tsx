// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ComponentProps } from "react";
import { TagBadgeFromString } from "@/components/tag/tag-badge";

type SearchSortTagProps = {
  label: string;
  color?: string;
  className?: string;
  style?: ComponentProps<typeof TagBadgeFromString>["style"];
};

export function SearchSortTag({
  label,
  color,
  className,
  style,
}: SearchSortTagProps) {
  const sortStyle = color
    ? ({ "--badge-overlay": color } as ComponentProps<
        typeof TagBadgeFromString
      >["style"])
    : undefined;
  const combinedStyle = { ...sortStyle, ...style };

  return (
    <TagBadgeFromString
      displayTag={label}
      size="default-wrap"
      className={className}
      style={combinedStyle}
    />
  );
}
