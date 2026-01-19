// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

function getTextNode(element: HTMLElement) {
  const child = element.firstChild;
  if (!child || child.nodeType !== Node.TEXT_NODE) {
    return null;
  }
  return child as Text;
}

function getMatchRanges(text: string, query: string): Array<[number, number]> {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const ranges: Array<[number, number]> = [];

  let index = 0;
  while (index < lowerText.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, index);
    if (matchIndex === -1) break;
    ranges.push([matchIndex, matchIndex + lowerQuery.length]);
    index = matchIndex + lowerQuery.length;
  }

  return ranges;
}

interface PagesSearchHighlightsOptions {
  query: string;
  highlightName: string;
}

export function usePagesSearchHighlights({
  query,
  highlightName,
}: PagesSearchHighlightsOptions) {
  const elementMapRef = useRef<Map<string, HTMLElement | null>>(new Map());
  const supportsCustomHighlight = useMemo(() => {
    return (
      typeof CSS !== "undefined" &&
      "highlights" in CSS &&
      typeof Highlight !== "undefined"
    );
  }, []);

  const registerLabelRef = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      if (node) {
        elementMapRef.current.set(key, node);
      } else {
        elementMapRef.current.delete(key);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    if (!supportsCustomHighlight) {
      return;
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      CSS.highlights.delete(highlightName);
      return;
    }

    const ranges: Array<Range> = [];

    elementMapRef.current.forEach((element) => {
      if (!element) return;
      const textNode = getTextNode(element);
      if (!textNode) return;

      const textContent = textNode.textContent;
      if (!textContent) return;

      const matches = getMatchRanges(textContent, normalizedQuery);
      matches.forEach(([start, end]) => {
        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);
        ranges.push(range);
      });
    });

    if (ranges.length > 0) {
      CSS.highlights.set(highlightName, new Highlight(...ranges));
    } else {
      CSS.highlights.delete(highlightName);
    }

    return () => {
      CSS.highlights.delete(highlightName);
    };
  }, [highlightName, query, supportsCustomHighlight]);

  return {
    registerLabelRef,
    supportsCustomHighlight,
  };
}
