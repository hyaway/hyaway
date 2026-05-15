// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { ComponentProps } from "react";
import { TagBadgeFromString } from "@/components/tag/tag-badge";

type SearchSortTagProps = {
  label: string;
  color?: string;
  className?: string;
};

export function SearchSortTag({ label, color, className }: SearchSortTagProps) {
  const style = color
    ? ({ "--badge-overlay": color } as ComponentProps<
        typeof TagBadgeFromString
      >["style"])
    : undefined;

  return (
    <TagBadgeFromString
      displayTag={label}
      size="default-wrap"
      className={className}
      style={style}
    />
  );
}
