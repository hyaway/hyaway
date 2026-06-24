// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useLayoutEffect, useReducer, useRef } from "react";
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

const supportsCustomHighlight =
  typeof CSS !== "undefined" &&
  "highlights" in CSS &&
  typeof Highlight !== "undefined";

interface PagesSearchHighlightsOptions {
  query: string;
  highlightName: string;
}

export function usePagesSearchHighlights({
  query,
  highlightName,
}: PagesSearchHighlightsOptions) {
  const elementMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const callbackMapRef = useRef<
    Map<string, (node: HTMLElement | null) => void>
  >(new Map());
  const [elementVersion, bumpElementVersion] = useReducer(
    (value: number) => value + 1,
    0,
  );

  const registerLabelRef = useCallback((key: string) => {
    const existingCallback = callbackMapRef.current.get(key);
    if (existingCallback) {
      return existingCallback;
    }

    const callback = (node: HTMLElement | null) => {
      const previousNode = elementMapRef.current.get(key) ?? null;

      if (node) {
        elementMapRef.current.set(key, node);
      } else {
        elementMapRef.current.delete(key);
      }

      if (previousNode !== node) {
        bumpElementVersion();
      }
    };

    callbackMapRef.current.set(key, callback);
    return callback;
  }, []);

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
