// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconArchiveOff,
  IconFileDownload,
  IconFileText,
  IconMovie,
  IconMusic,
  IconPhoto,
  IconRefresh,
  IconSend,
  IconTrash,
  IconTrashOff,
} from "@tabler/icons-react";

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
import { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import {
  useAddFilesToPageMutation,
  useFocusPageMutation,
  useGetMediaPagesQuery,
} from "@/integrations/hydrus-api/queries/manage-pages";
import {
  useSendToPageKey,
  useSendToPageName,
} from "@/stores/send-to-page-store";
import { resolveSendToPageState } from "@/lib/send-to-page";

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

// --- Send to Hydrus Page Action ---

/**
 * Action that adds the file to the user's configured "send to" Hydrus page
 * (and focuses it). Empty when the key lacks Manage Pages permission. Toasts a
 * warning when no page is configured or the configured page is closed.
 */
function useSendToPageAction(fileId: number): Array<FileAction> {
  const { hasPermission } = usePermissions();
  const canManagePages = hasPermission(Permission.MANAGE_PAGES);
  const pageKey = useSendToPageKey();
  const pageName = useSendToPageName();
  const { data: mediaPages } = useGetMediaPagesQuery();
  const { mutate: addFilesToPage } = useAddFilesToPageMutation();
  const { mutate: focusPage } = useFocusPageMutation();

  if (!canManagePages) return [];

  const handleSend = () => {
    const resolution = resolveSendToPageState(pageKey, pageName, mediaPages);

    if (resolution.status === "unset") {
      toast("No target page set", {
        description: "Choose a Hydrus page in Settings → Data.",
      });
      return;
    }

    if (resolution.status === "closed") {
      toast.warning(
        resolution.name
          ? `“${resolution.name}” is closed in Hydrus`
          : "The target page is closed in Hydrus",
        { description: "Reopen it in Hydrus, or pick another in Settings." },
      );
      return;
    }

    addFilesToPage(
      { pageKey: resolution.pageKey, fileIds: [fileId] },
      {
        onSuccess: () => {
          focusPage(resolution.pageKey);
          toast.success(`Sent to “${resolution.name}”`);
        },
        onError: () => {
          toast.warning(`Couldn’t send to “${resolution.name}”`, {
            description: "The page may have just been closed.",
          });
        },
      },
    );
  };

  return [
    {
      id: "send-to-page",
      label: pageName ? `Send to “${pageName}”` : "Send to Hydrus page",
      icon: IconSend,
      onClick: handleSend,
      overflowOnly: true,
    },
  ];
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
  /** Include the "Send to Hydrus page" action */
  includeSendToPage?: boolean;
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
    includeSendToPage = false,
    onRefetch,
    isRefetching,
    reviewSource,
  } = options;

  const isPermanentlyDeleted = data.is_deleted && !data.is_trashed;

  // Always call hooks (rules of hooks), but conditionally include results
  const navigationActions = useNavigationActions(data.file_id);
  const managementActions = useManagementActions(data, reviewSource);
  const externalActions = useExternalActions(data, { includeThumbnail });
  const sendToPageActions = useSendToPageAction(data.file_id);

  const groups: Array<FileActionsGroup> = [];

  if (includeOpen) {
    groups.push({ id: "navigation", actions: navigationActions });
  }

  // Skip management and external actions for permanently deleted files
  if (!isPermanentlyDeleted) {
    groups.push({ id: "management", actions: managementActions });

    if (includeExternal) {
      groups.push({ id: "external", actions: externalActions });
    }

    if (includeSendToPage && sendToPageActions.length > 0) {
      groups.push({ id: "page", actions: sendToPageActions });
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
