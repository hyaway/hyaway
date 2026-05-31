// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  getPagesSearchMatchRanges,
  getPagesSearchTerms,
} from "../-hooks/use-pages-tree-search";
import type { ReactNode } from "react";

interface HighlightedTextProps {
  text: string;
  query: string;
  useCustomHighlight?: boolean;
}

export function HighlightedText({
  text,
  query,
  useCustomHighlight = false,
}: HighlightedTextProps) {
  const terms = getPagesSearchTerms(query);

  if (useCustomHighlight || terms.length === 0) {
    return text;
  }

  const parts: Array<ReactNode> = [];
  let currentIndex = 0;
  const ranges = getPagesSearchMatchRanges(text, terms);

  ranges.forEach(([start, end]) => {
    if (start < currentIndex) {
      return;
    }

    if (start > currentIndex) {
      parts.push(text.slice(currentIndex, start));
    }

    const matchText = text.slice(start, end);
    parts.push(
      <mark
        key={`match-${start}-${end}`}
        className="bg-primary text-primary-foreground rounded-xs"
      >
        {matchText}
      </mark>,
    );

    currentIndex = end;
  });

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts;
}
