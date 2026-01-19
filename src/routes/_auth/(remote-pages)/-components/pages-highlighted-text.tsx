// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

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
  const normalizedQuery = query.trim();

  if (useCustomHighlight || !normalizedQuery) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const parts: Array<ReactNode> = [];

  let currentIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, currentIndex);

  while (matchIndex !== -1) {
    if (matchIndex > currentIndex) {
      parts.push(text.slice(currentIndex, matchIndex));
    }

    const matchText = text.slice(matchIndex, matchIndex + lowerQuery.length);
    parts.push(
      <mark
        key={`match-${matchIndex}`}
        className="bg-primary text-primary-foreground rounded-xs"
      >
        {matchText}
      </mark>,
    );

    currentIndex = matchIndex + lowerQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, currentIndex);
  }

  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts;
}
