// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import type { PagesTreeNode } from "@/integrations/hydrus-api/queries/manage-pages";

export interface PageGroupMeta {
  label: string;
  stripeColorsByLevel: Array<string | null>;
}

export function buildPageGroupMetaByPageKey(root: PagesTreeNode | null) {
  const map = new Map<string, PageGroupMeta>();

  if (!root?.pages?.length) {
    return map;
  }

  const baseHue = 277;
  const baseLightness = 0.59;
  const baseChroma = 0.2;

  const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) % 360;
    }
    return hash;
  };

  const groupChildCounts = new Map<string, number>();
  const stack: Array<{ node: PagesTreeNode; path: Array<string> }> =
    root.pages.map((node) => ({ node, path: [] }));

  while (stack.length) {
    const current = stack.pop()!;
    const isGroup = !current.node.is_media_page;
    const nextPath = isGroup
      ? [...current.path, current.node.name]
      : current.path;

    if (isGroup) {
      const key = nextPath.join(" / ");
      if (key) {
        const mediaCount =
          current.node.pages?.filter((child) => child.is_media_page).length ??
          0;
        groupChildCounts.set(key, mediaCount);
      }
    }

    if (current.node.pages?.length) {
      current.node.pages.forEach((child) => {
        stack.push({ node: child, path: nextPath });
      });
    }
  }

  const stackForLabels: Array<{ node: PagesTreeNode; path: Array<string> }> =
    root.pages.map((node) => ({ node, path: [] }));

  while (stackForLabels.length) {
    const current = stackForLabels.pop()!;
    const isGroup = !current.node.is_media_page;
    const nextPath = isGroup
      ? [...current.path, current.node.name]
      : current.path;

    if (current.node.is_media_page) {
      const label = current.path.join(" / ");
      const stripeColorsByLevel = current.path.map((_, index) => {
        const key = current.path.slice(0, index + 1).join(" / ");
        if ((groupChildCounts.get(key) ?? 0) === 0) {
          return null;
        }

        const hueOffset = hashString(key) - 180;
        const hue = (baseHue + hueOffset + 360) % 360;
        return `oklch(${baseLightness} ${baseChroma} ${hue})`;
      });

      map.set(current.node.page_key, {
        label,
        stripeColorsByLevel,
      });
    }

    if (current.node.pages?.length) {
      current.node.pages.forEach((child) => {
        stackForLabels.push({ node: child, path: nextPath });
      });
    }
  }

  return map;
}

export function usePageGroupMetaByPageKey(root: PagesTreeNode | null) {
  return useMemo(() => buildPageGroupMetaByPageKey(root), [root]);
}
