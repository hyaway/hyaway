// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useSearch } from "@tanstack/react-router";
import { PagesSearchInput } from "./pages-search-input";
import { PagesTreeView } from "./pages-tree-view";
import type { MediaPage } from "@/integrations/hydrus-api/models";
import type { PagesTreeNode } from "@/integrations/hydrus-api/queries/manage-pages";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui-primitives/sidebar";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";

interface PagesIndexRightSidebarProps {
  tree: PagesTreeNode | null;
  latestPage: MediaPage | null;
  treeEmptyMessage?: string;
}

const PAGES_ROUTE_FULL_PATH = "/_auth/(remote-pages)/pages/";

export function PagesIndexRightSidebar({
  tree,
  latestPage,
  treeEmptyMessage,
}: PagesIndexRightSidebarProps) {
  const { q } = useSearch({ from: PAGES_ROUTE_FULL_PATH });
  const query = q ?? "";

  return (
    <RightSidebarPortal>
      <div className="flex h-full flex-col overflow-hidden">
        <SidebarHeader className="gap-3 px-3 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm/5 font-semibold">Pages</h2>
          </div>
          <PagesSearchInput variant="sidebar" />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel>{tree?.name ?? "Pages tree"}</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <PagesTreeView
                root={tree}
                latestPage={latestPage}
                query={query}
                emptyMessage={treeEmptyMessage}
              />
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </RightSidebarPortal>
  );
}
