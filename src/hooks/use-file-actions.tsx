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
    "file_id" | "is_inbox" | "is_trashed" | "ext" | "filetype_human" | "mime"
  >,
  options: UseFileActionsOptions = {},
): Array<FileActionsGroup> {
  const {
    includeOpen = false,
    includeExternal = true,
    includeThumbnail = true,
  } = options;

  const navigate = useNavigate();
  const { url: fileUrl } = useFullFileIdUrl(data.file_id);
  const { url: thumbnailUrl } = useThumbnailUrl(data.file_id);
  const downloadUrl = useDownloadFileIdUrl(data.file_id);

  const deleteFilesMutation = useDeleteFilesMutation();
  const undeleteFilesMutation = useUndeleteFilesMutation();
  const archiveFilesMutation = useArchiveFilesMutation();
  const unarchiveFilesMutation = useUnarchiveFilesMutation();

  const groups: Array<FileActionsGroup> = [];

  // Navigation actions
  if (includeOpen) {
    groups.push({
      id: "navigation",
      actions: [
        {
          id: "open",
          label: "Open",
          icon: IconFileText,
          onClick: () =>
            navigate({
              to: "/file/$fileId",
              params: { fileId: String(data.file_id) },
            }),
        },
        {
          id: "open-details-new-tab",
          label: "Open in New Tab",
          icon: IconFileText,
          onClick: () => {
            window.open(
              `/file/${data.file_id}`,
              "_blank",
              "noopener,noreferrer",
            );
          },
          href: `/file/${data.file_id}`,
          external: true,
        },
      ],
    });
  }

  // File management actions (these should be visible in the floating bar)
  const managementActions: Array<FileAction> = [];

  if (data.is_trashed) {
    managementActions.push({
      id: "undelete",
      label: "Undelete",
      icon: IconTrashOff,
      onClick: () => undeleteFilesMutation.mutate({ file_id: data.file_id }),
      isPending: undeleteFilesMutation.isPending,
    });
  } else {
    managementActions.push({
      id: "delete",
      label: "Trash",
      icon: IconTrash,
      onClick: () => deleteFilesMutation.mutate({ file_id: data.file_id }),
      variant: "destructive",
      isPending: deleteFilesMutation.isPending,
    });
  }

  if (data.is_inbox) {
    managementActions.push({
      id: "archive",
      label: "Archive",
      icon: IconArchive,
      onClick: () => archiveFilesMutation.mutate({ file_id: data.file_id }),
      isPending: archiveFilesMutation.isPending,
    });
  } else {
    managementActions.push({
      id: "unarchive",
      label: "Unarchive",
      icon: IconArchiveOff,
      onClick: () => unarchiveFilesMutation.mutate({ file_id: data.file_id }),
      isPending: unarchiveFilesMutation.isPending,
    });
  }

  groups.push({
    id: "management",
    actions: managementActions,
  });

  // External actions (download, open in new tab) - always in overflow
  if (includeExternal) {
    const mimeBasedIcon = data.mime.startsWith("image/")
      ? IconPhoto
      : data.mime.startsWith("video/")
        ? IconMovie
        : data.mime.startsWith("audio/")
          ? IconMusic
          : IconFileText;

    const externalActions: Array<FileAction> = [
      {
        id: "download",
        label: "Download",
        icon: IconFileDownload,
        onClick: () => {
          window.location.href = downloadUrl;
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
      externalActions.push({
        id: "view-thumbnail",
        label: "Open Thumbnail",
        icon: IconPhoto,
        onClick: () => {
          window.open(thumbnailUrl, "_blank", "noopener,noreferrer");
        },
        href: thumbnailUrl,
        external: true,
        overflowOnly: true,
      });
    }

    groups.push({
      id: "external",
      actions: externalActions,
    });
  }

  return groups;
}
