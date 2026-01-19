// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { usePagesSearchHighlights } from "../-hooks/use-pages-search-highlights";
import { filterPagesTree } from "../-hooks/use-pages-tree-search";
import { HighlightedText } from "./pages-highlighted-text";
import type { PagesTreeNode } from "@/integrations/hydrus-api/queries/manage-pages";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuLinkButton,
} from "@/components/ui-primitives/sidebar";
import { cn } from "@/lib/utils";
import { usePagesUseFriendlyUrls } from "@/stores/pages-settings-store";

interface PagesTreeViewProps {
  root: PagesTreeNode | null;
  query: string;
  emptyMessage?: string;
}

type PagesTreeRow = {
  node: PagesTreeNode;
  depth: number;
  isGroup: boolean;
};

const sidebarMenuButtonClassName =
  "relative ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground gap-2.5 rounded-lg p-2.5 text-left text-sm transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-10 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 data-active:font-medium peer/menu-button flex w-full items-center overflow-hidden outline-hidden group/menu-button disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&_svg]:size-6 [&_svg]:shrink-0";

function buildTreeRows(root: PagesTreeNode | null, expandedKeys: Set<string>) {
  const rows: Array<PagesTreeRow> = [];

  const visit = (node: PagesTreeNode, depth: number) => {
    const isGroup = !node.is_media_page;
    rows.push({ node, depth, isGroup });

    if (!node.pages?.length) {
      return;
    }

    if (isGroup && !expandedKeys.has(node.page_key)) {
      return;
    }

    node.pages.forEach((child) => visit(child, depth + 1));
  };

  if (root) {
    if (root.pages?.length) {
      root.pages.forEach((child) => visit(child, 0));
    }
  }

  return rows;
}

export function PagesTreeView({
  root,
  query,
  emptyMessage = "No pages found.",
}: PagesTreeViewProps) {
  const useFriendlyUrls = usePagesUseFriendlyUrls();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const { tree: filteredTree, autoExpandKeys } = useMemo(
    () => filterPagesTree(root, query),
    [query, root],
  );

  const effectiveExpandedKeys = useMemo(() => {
    if (!query.trim()) {
      return expandedKeys;
    }
    return new Set([...expandedKeys, ...autoExpandKeys]);
  }, [autoExpandKeys, expandedKeys, query]);

  const rows = useMemo(
    () => buildTreeRows(filteredTree, effectiveExpandedKeys),
    [effectiveExpandedKeys, filteredTree],
  );

  const { registerLabelRef, supportsCustomHighlight } =
    usePagesSearchHighlights({
      query,
      highlightName: "hyaway-pages-search-tree",
    });

  const toggleGroup = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!filteredTree || rows.length === 0) {
    return (
      <p className="text-muted-foreground px-2 py-3 text-xs/5">
        {emptyMessage}
      </p>
    );
  }

  return (
    <SidebarMenu className="px-1">
      {rows.map((row) =>
        row.isGroup ? (
          <SidebarMenuItem
            key={row.node.page_key}
            style={{ paddingLeft: `${row.depth * 12 + 8}px` }}
          >
            <button
              type="button"
              onClick={() => toggleGroup(row.node.page_key)}
              aria-expanded={effectiveExpandedKeys.has(row.node.page_key)}
              className={cn(sidebarMenuButtonClassName, "gap-2")}
            >
              <IconChevronRight
                className={cn(
                  "text-muted-foreground size-4 transition-transform",
                  effectiveExpandedKeys.has(row.node.page_key) && "rotate-90",
                )}
              />
              <span
                ref={registerLabelRef(row.node.page_key)}
                className="truncate"
              >
                <HighlightedText
                  text={row.node.name}
                  query={query}
                  useCustomHighlight={supportsCustomHighlight}
                />
              </span>
            </button>
          </SidebarMenuItem>
        ) : (
          <SidebarMenuItem
            key={row.node.page_key}
            style={{ paddingLeft: `${row.depth * 12 + 24}px` }}
          >
            <SidebarMenuLinkButton
              to="/pages/$pageId"
              params={{
                pageId: useFriendlyUrls
                  ? (row.node.slug ?? row.node.page_key)
                  : row.node.page_key,
              }}
            >
              <span
                ref={registerLabelRef(row.node.page_key)}
                className="truncate"
              >
                <HighlightedText
                  text={row.node.name}
                  query={query}
                  useCustomHighlight={supportsCustomHighlight}
                />
              </span>
            </SidebarMenuLinkButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  );
}
