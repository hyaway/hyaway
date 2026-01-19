// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { PagesTreeNode } from "@/integrations/hydrus-api/queries/manage-pages";

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

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
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
  ): PagesTreeNode | null => {
    const nameMatch = node.name.toLowerCase().includes(normalizedQuery);
    const isGroup = !node.is_media_page;
    const groupMatch = isGroup && nameMatch;

    if (ancestorGroupMatched || groupMatch) {
      expandAllGroups(node);
      return node;
    }

    const filteredChildren = node.pages
      ?.map((child) => filterNode(child, false))
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

  const tree = filterNode(root, false);
  return { tree, autoExpandKeys };
}
