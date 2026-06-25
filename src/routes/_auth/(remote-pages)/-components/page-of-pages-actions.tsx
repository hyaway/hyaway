// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconFolder, IconFolderPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { Page } from "@/integrations/hydrus-api/models";
import type { ComponentType, FormEvent, ReactNode, SVGProps } from "react";
import { OverflowActionItem } from "@/components/page-shell/page-floating-footer";
import { Button } from "@/components/ui-primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export function usePageOfPagesActions(rootPage: Page | undefined): {
  actions: Array<FloatingFooterAction>;
  dialog: ReactNode;
} {
  const apiVersionQuery = useApiVersionQuery();
  const permissions = usePermissions();
  const createPageMutation = useCreatePageMutation();
  const [dialogRequest, setDialogRequest] =
    useState<PageOfPagesDialogRequest | null>(null);

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

  const handleCloseDialog = useCallback(() => setDialogRequest(null), []);

  const actions = useMemo((): Array<FloatingFooterAction> => {
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
              onOpenDialog={setDialogRequest}
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
                      onOpenDialog={setDialogRequest}
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
                          onOpenDialog={setDialogRequest}
                        />
                        {section.descendants.map((destination) => (
                          <CreatePageOfPagesNameDialogItem
                            key={destination.pageKey}
                            label={destination.label}
                            pageOfPagesKey={destination.pageKey}
                            isCreating={isCreating}
                            onOpenDialog={setDialogRequest}
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
    pageOfPagesSections,
    permissions,
  ]);

  const dialog = (
    <CreatePageOfPagesNameDialog
      request={dialogRequest}
      isCreating={createPageMutation.isPending}
      onCreate={handleCreatePageOfPages}
      onClose={handleCloseDialog}
    />
  );

  return { actions, dialog };
}

type PageOfPagesDialogRequest = {
  label: string;
  pageOfPagesKey?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title?: string;
  truncate?: boolean;
};

function CreatePageOfPagesNameDialogItem({
  action,
  label = action?.label ?? "New page of pages",
  pageOfPagesKey,
  isCreating,
  onOpenDialog,
  truncate = false,
}: {
  action?: FloatingFooterAction;
  label?: string;
  pageOfPagesKey?: string;
  isCreating: boolean;
  onOpenDialog: (request: PageOfPagesDialogRequest) => void;
  truncate?: boolean;
}) {
  const Icon = action?.icon;

  return (
    <DropdownMenuItem
      onClick={() =>
        onOpenDialog({
          label,
          pageOfPagesKey,
          icon: Icon,
          title: action?.title,
          truncate,
        })
      }
      disabled={isCreating}
      title={action?.title}
      className="cursor-pointer"
    >
      {Icon ? <Icon /> : null}
      <PageOfPagesDestinationLabel label={label} truncate={truncate} />
    </DropdownMenuItem>
  );
}

function CreatePageOfPagesNameDialog({
  request,
  isCreating,
  onCreate,
  onClose,
}: {
  request: PageOfPagesDialogRequest | null;
  isCreating: boolean;
  onCreate: (pageName: string, pageOfPagesKey?: string) => void;
  onClose: () => void;
}) {
  const [pageName, setPageName] = useState("");
  const label = request?.label ?? "New page of pages";
  const trimmedPageName = pageName.trim();

  useEffect(() => {
    if (request) setPageName("");
  }, [request]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!request || !trimmedPageName || isCreating) return;

    onCreate(trimmedPageName, request.pageOfPagesKey);
    onClose();
    setPageName("");
  };

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Page of pages name</DialogTitle>
          <DialogDescription>
            {request?.pageOfPagesKey
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
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
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
