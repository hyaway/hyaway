// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconSend } from "@tabler/icons-react";
import { SettingsGroup } from "./setting-fields";
import {
  useSendToPageActions,
  useSendToPageKey,
  useSendToPageName,
} from "@/stores/send-to-page-store";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { Permission } from "@/integrations/hydrus-api/models";
import { Button } from "@/components/ui-primitives/button";
import { Label } from "@/components/ui-primitives/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";

export const SEND_TO_PAGE_SETTINGS_TITLE = "Send to Hydrus page";

export function SendToPageSettings() {
  const pageKey = useSendToPageKey();
  const pageName = useSendToPageName();
  const { setSendToPage, clearSendToPage } = useSendToPageActions();
  const { hasPermission, isFetched } = usePermissions();
  const canManagePages = hasPermission(Permission.MANAGE_PAGES);
  const { data: pages } = useGetMediaPagesQuery();

  if (isFetched && !canManagePages) {
    return (
      <p className="text-muted-foreground text-sm">
        Requires the “Manage Pages” API permission.
      </p>
    );
  }

  const openName = pages.find((page) => page.page_key === pageKey)?.name;
  const selectedLabel = openName ?? pageName ?? "Choose a page…";
  const configuredButClosed = pageKey != null && openName == null;

  const handleSelect = (value: string) => {
    if (!value) {
      clearSendToPage();
      return;
    }
    const name = pages.find((page) => page.page_key === value)?.name ?? value;
    setSendToPage(value, name);
  };

  return (
    <SettingsGroup>
      <div className="flex min-w-0 flex-col gap-2">
        <Label className="text-sm">Target page</Label>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                variant="outline"
                size="sm"
                className="w-full min-w-0 justify-start"
              >
                <IconSend className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{selectedLabel}</span>
              </Button>
            )}
          />
          <DropdownMenuContent
            align="start"
            className="max-h-[50dvh] w-72 overflow-y-auto"
          >
            <DropdownMenuRadioGroup
              value={pageKey ?? ""}
              onValueChange={handleSelect}
            >
              <DropdownMenuRadioItem value="">None</DropdownMenuRadioItem>
              {pages.length > 0 && <DropdownMenuSeparator />}
              {pages.map((page) => (
                <DropdownMenuRadioItem key={page.page_key} value={page.page_key}>
                  <span className="min-w-0 flex-1 truncate">{page.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-muted-foreground text-xs">
          The “Send to Hydrus page” action in a file’s ⋯ menu adds it to this
          page (and focuses it). Hydrus has no API to create a new page, so pick
          an existing open one — you’ll get a warning if it’s closed when you use
          the action.
        </p>

        {configuredButClosed && (
          <p className="text-destructive text-xs">
            “{pageName}” isn’t currently open in Hydrus.
          </p>
        )}
      </div>
    </SettingsGroup>
  );
}
