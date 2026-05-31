// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { PagesTreeNode } from "@/integrations/hydrus-api/queries/manage-pages";

export function getPagesSearchTerms(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s/\\>]+/)
    .filter(Boolean);
}

export function getPagesSearchMatchRanges(
  text: string,
  terms: Array<string>,
): Array<[number, number]> {
  const lowerText = text.toLowerCase();
  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    let index = 0;

    while (index < lowerText.length) {
      const matchIndex = lowerText.indexOf(term, index);
      if (matchIndex === -1) break;
      ranges.push([matchIndex, matchIndex + term.length]);
      index = matchIndex + term.length;
    }
  }

  return ranges.sort(([aStart, aEnd], [bStart, bEnd]) => {
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    return bEnd - aEnd;
  });
}

export function collectGroupKeys(root: PagesTreeNode | null) {
  const keys = new Set<string>();

  const visit = (node: PagesTreeNode) => {
    if (!node.is_media_page) {
      keys.add(node.page_key);
    }
    node.pages?.forEach(visit);
  };

  if (root) {
    visit(root);
  }

  return keys;
}

interface FilterPagesTreeResult {
  tree: PagesTreeNode | null;
  autoExpandKeys: Set<string>;
}

export function filterPagesTree(
  root: PagesTreeNode | null,
  query: string,
): FilterPagesTreeResult {
  if (!root) {
    return { tree: null, autoExpandKeys: new Set() };
  }

  const terms = getPagesSearchTerms(query);
  if (terms.length === 0) {
    return { tree: root, autoExpandKeys: new Set() };
  }

  const autoExpandKeys = new Set<string>();

  const expandAllGroups = (node: PagesTreeNode) => {
    if (!node.is_media_page) {
      autoExpandKeys.add(node.page_key);
    }
    node.pages?.forEach(expandAllGroups);
  };

  const filterNode = (
    node: PagesTreeNode,
    ancestorGroupMatched: boolean,
    ancestorNames: Array<string>,
  ): PagesTreeNode | null => {
    const pathText = [...ancestorNames, node.name].join(" ").toLowerCase();
    const nameMatch = terms.every((term) => pathText.includes(term));
    const isGroup = !node.is_media_page;
    const groupMatch = isGroup && nameMatch;

    if (ancestorGroupMatched || groupMatch) {
      expandAllGroups(node);
      return node;
    }

    const nextAncestorNames = isGroup
      ? [...ancestorNames, node.name]
      : ancestorNames;
    const filteredChildren = node.pages
      ?.map((child) => filterNode(child, false, nextAncestorNames))
      .filter((child): child is PagesTreeNode => child !== null);

    const hasChildren = Boolean(filteredChildren?.length);

    if (!nameMatch && !hasChildren) {
      return null;
    }

    if (isGroup && hasChildren) {
      autoExpandKeys.add(node.page_key);
    }

    return {
      ...node,
      pages: hasChildren ? filteredChildren : undefined,
    };
  };

  const filteredChildren = root.pages
    ?.map((child) => filterNode(child, false, []))
    .filter((child): child is PagesTreeNode => child !== null);

  if (!filteredChildren?.length) {
    return { tree: null, autoExpandKeys };
  }

  return {
    tree: {
      ...root,
      pages: filteredChildren,
    },
    autoExpandKeys,
  };
}
