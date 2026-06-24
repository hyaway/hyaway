// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo, useState } from "react";
import { IconFolder, IconFolderPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { Page } from "@/integrations/hydrus-api/models";
import type { FormEvent } from "react";
import { OverflowActionItem } from "@/components/page-shell/page-floating-footer";
import { Button } from "@/components/ui-primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui-primitives/dialog";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Input } from "@/components/ui-primitives/input";
import {
  MIN_CREATE_PAGE_CLIENT_API_VERSION,
  PageType,
  Permission,
} from "@/integrations/hydrus-api/models";
import { useApiVersionQuery } from "@/integrations/hydrus-api/queries/access";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import {
  buildPageOfPagesDestinationSections,
  useCreatePageMutation,
} from "@/integrations/hydrus-api/queries/manage-pages";

export function usePageOfPagesActions(
  rootPage: Page | undefined,
): Array<FloatingFooterAction> {
  const apiVersionQuery = useApiVersionQuery();
  const permissions = usePermissions();
  const createPageMutation = useCreatePageMutation();

  const pageOfPagesSections = useMemo(
    () => (rootPage ? buildPageOfPagesDestinationSections(rootPage) : []),
    [rootPage],
  );

  const handleCreatePageOfPages = useCallback(
    (pageName: string, pageOfPagesKey?: string) => {
      createPageMutation.mutate(
        {
          page_type: PageType.PAGE_OF_PAGES,
          page_name: pageName,
          page_of_pages_key: pageOfPagesKey,
          focus_page: false,
        },
        {
          onSuccess: (page) => {
            toast.success("Hydrus page of pages created", {
              description: page.page_name,
            });
          },
          onError: (error) => {
            toast.error("Failed to create Hydrus page of pages", {
              description:
                error instanceof Error ? error.message : "Unknown error",
            });
          },
        },
      );
    },
    [createPageMutation],
  );

  return useMemo((): Array<FloatingFooterAction> => {
    const isCreating = createPageMutation.isPending;
    const canCreatePagesWithClientApi =
      (apiVersionQuery.data?.version ?? 0) >=
      MIN_CREATE_PAGE_CLIENT_API_VERSION;
    const canManagePages = permissions.hasPermission(Permission.MANAGE_PAGES);
    const createPageDisabledTitle = !canCreatePagesWithClientApi
      ? "Requires Hydrus v676"
      : !permissions.isFetched
        ? "Checking Hydrus permissions."
        : !canManagePages
          ? "Requires Manage pages permission."
          : undefined;
    const createPageDisabled =
      isCreating ||
      !canCreatePagesWithClientApi ||
      !permissions.isFetched ||
      !canManagePages;

    return [
      {
        id: "create-page-of-pages-root",
        label: "New page of pages",
        icon: IconFolderPlus,
        onClick: () => undefined,
        isPending: isCreating,
        disabled: createPageDisabled,
        title: createPageDisabledTitle,
        overflowOnly: true,
        renderOverflow: (action) =>
          action.disabled ? (
            <OverflowActionItem action={action} />
          ) : (
            <CreatePageOfPagesNameDialogItem
              action={action}
              isCreating={isCreating}
              onCreate={handleCreatePageOfPages}
            />
          ),
      },
      {
        id: "create-page-of-pages-in-page-of-pages",
        label: "New page of pages in...",
        icon: IconFolder,
        onClick: () => undefined,
        disabled: createPageDisabled || pageOfPagesSections.length === 0,
        title: createPageDisabledTitle,
        overflowOnly: true,
        renderOverflow: (action) =>
          createPageDisabled || pageOfPagesSections.length === 0 ? (
            <OverflowActionItem action={action} />
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <action.icon />
                {action.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[min(60dvh,var(--available-height))] min-w-64">
                {pageOfPagesSections.map((section) =>
                  section.descendants.length === 0 ? (
                    <CreatePageOfPagesNameDialogItem
                      key={section.pageKey}
                      label={section.label}
                      pageOfPagesKey={section.pageKey}
                      isCreating={isCreating}
                      onCreate={handleCreatePageOfPages}
                    />
                  ) : (
                    <DropdownMenuSub key={section.pageKey}>
                      <DropdownMenuSubTrigger>
                        {section.label}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[min(60dvh,var(--available-height))] min-w-64">
                        <CreatePageOfPagesNameDialogItem
                          label={section.label}
                          pageOfPagesKey={section.pageKey}
                          isCreating={isCreating}
                          onCreate={handleCreatePageOfPages}
                        />
                        {section.descendants.map((destination) => (
                          <CreatePageOfPagesNameDialogItem
                            key={destination.pageKey}
                            label={destination.label}
                            pageOfPagesKey={destination.pageKey}
                            isCreating={isCreating}
                            onCreate={handleCreatePageOfPages}
                            truncate
                          />
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ),
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ),
      },
    ];
  }, [
    apiVersionQuery.data?.version,
    createPageMutation.isPending,
    handleCreatePageOfPages,
    pageOfPagesSections,
    permissions,
  ]);
}

function CreatePageOfPagesNameDialogItem({
  action,
  label = action?.label ?? "New page of pages",
  pageOfPagesKey,
  isCreating,
  onCreate,
  truncate = false,
}: {
  action?: FloatingFooterAction;
  label?: string;
  pageOfPagesKey?: string;
  isCreating: boolean;
  onCreate: (pageName: string, pageOfPagesKey?: string) => void;
  truncate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pageName, setPageName] = useState("");
  const Icon = action?.icon;
  const trimmedPageName = pageName.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedPageName || isCreating) return;

    onCreate(trimmedPageName, pageOfPagesKey);
    setOpen(false);
    setPageName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <DropdownMenuItem
            closeOnClick={false}
            disabled={isCreating}
            title={action?.title}
            className="cursor-pointer"
          >
            {Icon ? <Icon /> : null}
            <PageOfPagesDestinationLabel label={label} truncate={truncate} />
          </DropdownMenuItem>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Page of pages name</DialogTitle>
          <DialogDescription>
            {pageOfPagesKey
              ? `Create inside ${label}.`
              : "Create at the Hydrus root."}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input
            autoFocus
            value={pageName}
            onChange={(event) => setPageName(event.target.value)}
            disabled={isCreating}
            required
            aria-label="Page of pages name"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!trimmedPageName || isCreating}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PageOfPagesDestinationLabel({
  label,
  truncate,
}: {
  label: string;
  truncate: boolean;
}) {
  if (!truncate) return label;

  return <span className="max-w-80 truncate">{label}</span>;
}
