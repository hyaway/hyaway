// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconArchiveOff,
  IconFileDownload,
  IconFileText,
  IconGhost2,
  IconMovie,
  IconMusic,
  IconPhoto,
  IconRefresh,
  IconTrash,
  IconTrashOff,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { ComponentType, SVGProps } from "react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import type { ReviewSource } from "@/stores/review-queue-store";

import {
  useDownloadFileIdUrl,
  useFullFileIdUrl,
  useThumbnailUrl,
} from "@/hooks/use-url-with-api-key";
import {
  useArchiveFilesMutation,
  useDeleteFilesMutation,
  useUnarchiveFilesMutation,
  useUndeleteFilesMutation,
} from "@/integrations/hydrus-api/queries/manage-files";
import { hideFileIdsInViewCaches } from "@/integrations/hydrus-api/queries/file-metadata-cache";
import { useAddFilesToScratchpadMutation } from "@/integrations/hydrus-api/queries/manage-pages";
import {
  MIN_CREATE_PAGE_CLIENT_API_VERSION,
  Permission,
} from "@/integrations/hydrus-api/models";
import { useApiVersionQuery } from "@/integrations/hydrus-api/queries/access";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useScratchpadHideSentFiles } from "@/stores/scratchpad-settings-store";

export interface FileAction {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  variant?: "default" | "destructive";
  href?: string;
  download?: boolean;
  external?: boolean;
  isPending?: boolean;
  /** If true, the action is disabled (e.g., due to missing permissions) */
  disabled?: boolean;
  /** If true, this action will always be in the overflow menu */
  overflowOnly?: boolean;
}

export interface FileActionsGroup {
  id: string;
  actions: Array<FileAction>;
}

// --- Navigation Actions ---

function useNavigationActions(fileId: number): Array<FileAction> {
  return [
    {
      id: "open-details-new-tab",
      label: "Open in new tab",
      icon: IconFileText,
      onClick: () => {
        window.open(`/file/${fileId}`, "_blank", "noopener,noreferrer");
      },
      href: `/file/${fileId}`,
      external: true,
    },
  ];
}

// --- Management Actions (Trash/Archive) ---

interface ManagementActionData {
  file_id: number;
  is_inbox?: boolean;
  is_trashed?: boolean;
}

function useManagementActions(
  data: ManagementActionData,
  reviewSource?: ReviewSource | Array<ReviewSource>,
): Array<FileAction> {
  const { hasPermission } = usePermissions();
  const canManageFiles = hasPermission(Permission.IMPORT_AND_DELETE_FILES);
  const deleteFilesMutation = useDeleteFilesMutation();
  const undeleteFilesMutation = useUndeleteFilesMutation();
  const archiveFilesMutation = useArchiveFilesMutation();
  const unarchiveFilesMutation = useUnarchiveFilesMutation();

  const trashAction: FileAction = data.is_trashed
    ? {
        id: "undelete",
        label: "Undelete",
        icon: IconTrashOff,
        onClick: () => undeleteFilesMutation.mutate({ file_id: data.file_id }),
        isPending: undeleteFilesMutation.isPending,
        disabled: !canManageFiles,
      }
    : {
        id: "delete",
        label: "Trash",
        icon: IconTrash,
        onClick: () =>
          deleteFilesMutation.mutate({
            file_id: data.file_id,
            reviewSource,
          }),
        variant: "destructive",
        isPending: deleteFilesMutation.isPending,
        disabled: !canManageFiles,
      };

  const archiveAction: FileAction = data.is_inbox
    ? {
        id: "archive",
        label: "Archive",
        icon: IconArchive,
        onClick: () => archiveFilesMutation.mutate({ file_id: data.file_id }),
        isPending: archiveFilesMutation.isPending,
        disabled: !canManageFiles,
      }
    : {
        id: "unarchive",
        label: "Unarchive",
        icon: IconArchiveOff,
        onClick: () => unarchiveFilesMutation.mutate({ file_id: data.file_id }),
        isPending: unarchiveFilesMutation.isPending,
        disabled: !canManageFiles,
      };

  return [trashAction, archiveAction];
}

// --- Page Actions ---

function usePageActions({
  fileId,
  reviewSource,
}: {
  fileId: number;
  reviewSource?: ReviewSource | Array<ReviewSource>;
}): Array<FileAction> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiVersionQuery = useApiVersionQuery();
  const permissions = usePermissions();
  const canCreatePagesWithClientApi =
    (apiVersionQuery.data?.version ?? 0) >= MIN_CREATE_PAGE_CLIENT_API_VERSION;
  const canManagePages = permissions.hasPermission(Permission.MANAGE_PAGES);
  const addFilesToScratchpadMutation = useAddFilesToScratchpadMutation();
  const scratchpadHideSentFiles = useScratchpadHideSentFiles();

  return [
    {
      id: "add-to-scratchpad",
      label: "Add to scratchpad",
      icon: IconGhost2,
      onClick: () =>
        addFilesToScratchpadMutation.mutate(
          { file_id: fileId },
          {
            onSuccess: (scratchpadPageKey) => {
              if (scratchpadHideSentFiles) {
                hideFileIdsInViewCaches(queryClient, [fileId], reviewSource);
              }
              toast.success("Added to scratchpad", {
                action: {
                  label: "Open scratchpad",
                  onClick: () =>
                    navigate({
                      to: "/pages/$pageId",
                      params: { pageId: scratchpadPageKey },
                    }),
                },
              });
            },
          },
        ),
      isPending: addFilesToScratchpadMutation.isPending,
      disabled:
        addFilesToScratchpadMutation.isPending ||
        !canCreatePagesWithClientApi ||
        !permissions.isFetched ||
        !canManagePages,
    },
  ];
}

// --- External Actions (Download/Open File/Thumbnail) ---

interface ExternalActionData {
  file_id: number;
  ext?: string;
  filetype_human?: string;
  mime: string;
}

interface UseExternalActionsOptions {
  includeThumbnail?: boolean;
}

function useExternalActions(
  data: ExternalActionData,
  options: UseExternalActionsOptions = {},
): Array<FileAction> {
  const { includeThumbnail = true } = options;

  const { url: fileUrl } = useFullFileIdUrl(data.file_id);
  const { url: thumbnailUrl } = useThumbnailUrl(data.file_id);
  const downloadUrl = useDownloadFileIdUrl(data.file_id);

  const mimeBasedIcon = data.mime.startsWith("image/")
    ? IconPhoto
    : data.mime.startsWith("video/")
      ? IconMovie
      : data.mime.startsWith("audio/")
        ? IconMusic
        : IconFileText;

  const actions: Array<FileAction> = [
    {
      id: "download",
      label: "Download",
      icon: IconFileDownload,
      onClick: () => {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "";
        link.click();
      },
      href: downloadUrl,
      download: true,
      overflowOnly: true,
    },
    {
      id: "open-new-tab",
      label: `Open ${data.ext || data.filetype_human}`,
      icon: mimeBasedIcon,
      onClick: () => {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      },
      href: fileUrl,
      external: true,
      overflowOnly: true,
    },
  ];

  if (includeThumbnail) {
    actions.push({
      id: "view-thumbnail",
      label: "Open thumbnail",
      icon: IconPhoto,
      onClick: () => {
        window.open(thumbnailUrl, "_blank", "noopener,noreferrer");
      },
      href: thumbnailUrl,
      external: true,
      overflowOnly: true,
    });
  }

  return actions;
}

// --- Loading Placeholder Actions ---

/**
 * Placeholder actions to show during loading states.
 * These maintain layout consistency while data is being fetched.
 */
export const LOADING_ACTIONS = [
  {
    id: "loading-trash",
    label: "Trash",
    icon: IconTrash,
    onClick: () => {},
    disabled: true,
  },
  {
    id: "loading-archive",
    label: "Archive",
    icon: IconArchive,
    onClick: () => {},
    disabled: true,
  },
] as const satisfies ReadonlyArray<FloatingFooterAction>;

// --- Main Composed Hook ---

interface UseFileActionsOptions {
  /** Include the "Open" action (navigate to file detail page) */
  includeOpen?: boolean;
  /** Include download and open in new tab actions */
  includeExternal?: boolean;
  /** Include the thumbnail action (set to false on detail page where full image is shown) */
  includeThumbnail?: boolean;
  /** Callback to refetch/refresh file data */
  onRefetch?: () => void;
  /** Whether refetch is in progress */
  isRefetching?: boolean;
  /** Source view to update if trashing should hide the item locally. */
  reviewSource?: ReviewSource | Array<ReviewSource>;
}

export function useFileActions(
  data: Pick<
    FileMetadata,
    | "file_id"
    | "is_inbox"
    | "is_trashed"
    | "is_deleted"
    | "ext"
    | "filetype_human"
    | "mime"
  >,
  options: UseFileActionsOptions = {},
): Array<FileActionsGroup> {
  const {
    includeOpen = false,
    includeExternal = true,
    includeThumbnail = true,
    onRefetch,
    isRefetching,
    reviewSource,
  } = options;

  const isPermanentlyDeleted = data.is_deleted && !data.is_trashed;

  // Always call hooks (rules of hooks), but conditionally include results
  const navigationActions = useNavigationActions(data.file_id);
  const managementActions = useManagementActions(data, reviewSource);
  const pageActions = usePageActions({
    fileId: data.file_id,
    reviewSource,
  });
  const externalActions = useExternalActions(data, { includeThumbnail });

  const groups: Array<FileActionsGroup> = [];

  if (includeOpen) {
    groups.push({ id: "navigation", actions: navigationActions });
  }

  // Skip management and external actions for permanently deleted files
  if (!isPermanentlyDeleted) {
    groups.push({ id: "management", actions: managementActions });
    groups.push({ id: "pages", actions: pageActions });

    if (includeExternal) {
      groups.push({ id: "external", actions: externalActions });
    }
  }

  // Add refetch action if callback provided
  if (onRefetch) {
    groups.push({
      id: "utility",
      actions: [
        {
          id: "refetch",
          label: "Refresh",
          icon: IconRefresh,
          onClick: onRefetch,
          isPending: isRefetching,
          overflowOnly: true,
        },
      ],
    });
  }

  return groups;
}
