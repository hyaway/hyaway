// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { PagesTreeView } from "./pages-tree-view";
import type { ChangeEvent } from "react";
import type { PagesTreeNode } from "@/integrations/hydrus-api/queries/manage-pages";
import { RightSidebarPortal } from "@/components/app-shell/right-sidebar-portal";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarSeparator,
} from "@/components/ui-primitives/sidebar";
import { ScrollArea } from "@/components/ui-primitives/scroll-area";

interface PagesIndexRightSidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  tree: PagesTreeNode | null;
  treeEmptyMessage?: string;
}

export function PagesIndexRightSidebar({
  query,
  onQueryChange,
  tree,
  treeEmptyMessage,
}: PagesIndexRightSidebarProps) {
  return (
    <RightSidebarPortal>
      <div className="flex h-full flex-col overflow-hidden">
        <SidebarHeader className="gap-3 px-3 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm/5 font-semibold">Pages</h2>
          </div>
          <SidebarInput
            placeholder="Search pages"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onQueryChange(event.target.value)
            }
          />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel>{tree?.name ?? "Pages tree"}</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              <PagesTreeView
                root={tree}
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
