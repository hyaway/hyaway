// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  getPagesSearchMatchRanges,
  getPagesSearchTerms,
} from "./use-pages-tree-search";

function getTextNode(element: HTMLElement) {
  const child = element.firstChild;
  if (!child || child.nodeType !== Node.TEXT_NODE) {
    return null;
  }
  return child as Text;
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
  const [elementVersion, bumpElementVersion] = useReducer(
    (value: number) => value + 1,
    0,
  );
  const supportsCustomHighlight = useMemo(() => {
    return (
      typeof CSS !== "undefined" &&
      "highlights" in CSS &&
      typeof Highlight !== "undefined"
    );
  }, []);

  const registerLabelRef = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      const previousNode = elementMapRef.current.get(key) ?? null;

      if (node) {
        elementMapRef.current.set(key, node);
      } else {
        elementMapRef.current.delete(key);
      }

      if (previousNode !== node) {
        bumpElementVersion();
      }
    },
    [],
  );

  useLayoutEffect(() => {
    if (!supportsCustomHighlight) {
      return;
    }

    const terms = getPagesSearchTerms(query);
    if (terms.length === 0) {
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

      const matches = getPagesSearchMatchRanges(textContent, terms);
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
  }, [elementVersion, highlightName, query, supportsCustomHighlight]);

  return {
    registerLabelRef,
    supportsCustomHighlight,
  };
}
