import {
  IconArchive,
  IconArchiveOff,
  IconFileDownload,
  IconFileText,
  IconMovie,
  IconMusic,
  IconPhoto,
  IconTrash,
  IconTrashOff,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";

import type { ComponentType, SVGProps } from "react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";
import type { FileMetadata } from "@/integrations/hydrus-api/models";

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
  /** If true, this action will always be in the overflow menu */
  overflowOnly?: boolean;
}

export interface FileActionsGroup {
  id: string;
  actions: Array<FileAction>;
}

// --- Navigation Actions ---

function useNavigationActions(fileId: number): Array<FileAction> {
  const navigate = useNavigate();

  return [
    {
      id: "open",
      label: "Open",
      icon: IconFileText,
      onClick: () =>
        navigate({
          to: "/file/$fileId",
          params: { fileId: String(fileId) },
        }),
    },
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

function useManagementActions(data: ManagementActionData): Array<FileAction> {
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
      }
    : {
        id: "delete",
        label: "Trash",
        icon: IconTrash,
        onClick: () => deleteFilesMutation.mutate({ file_id: data.file_id }),
        variant: "destructive",
        isPending: deleteFilesMutation.isPending,
      };

  const archiveAction: FileAction = data.is_inbox
    ? {
        id: "archive",
        label: "Archive",
        icon: IconArchive,
        onClick: () => archiveFilesMutation.mutate({ file_id: data.file_id }),
        isPending: archiveFilesMutation.isPending,
      }
    : {
        id: "unarchive",
        label: "Unarchive",
        icon: IconArchiveOff,
        onClick: () => unarchiveFilesMutation.mutate({ file_id: data.file_id }),
        isPending: unarchiveFilesMutation.isPending,
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
  } = options;

  const isPermanentlyDeleted = data.is_deleted && !data.is_trashed;

  // Always call hooks (rules of hooks), but conditionally include results
  const navigationActions = useNavigationActions(data.file_id);
  const managementActions = useManagementActions(data);
  const externalActions = useExternalActions(data, { includeThumbnail });

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
  }

  return groups;
}
