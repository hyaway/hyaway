import {
  ArchiveBoxArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUturnUpIcon,
  DocumentTextIcon,
  InboxArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "@tanstack/react-router";

import type { ComponentType, SVGProps } from "react";
import type { FileMetadata } from "@/integrations/hydrus-api/models";

import {
  useDownloadFileIdUrl,
  useFullFileIdUrl,
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
}

export function useFileActions(
  data: Pick<
    FileMetadata,
    "file_id" | "is_inbox" | "is_trashed" | "ext" | "filetype_human"
  >,
  options: UseFileActionsOptions = {},
): Array<FileActionsGroup> {
  const { includeOpen = false, includeExternal = true } = options;

  const navigate = useNavigate();
  const { url: fileUrl } = useFullFileIdUrl(data.file_id);
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
          label: "Details",
          icon: DocumentTextIcon,
          onClick: () =>
            navigate({
              to: "/file/$fileId",
              params: { fileId: String(data.file_id) },
            }),
        },
      ],
    });
  }

  // File management actions (these should be visible in the floating bar)
  const managementActions: Array<FileAction> = [];

  if (data.is_trashed) {
    managementActions.push({
      id: "undelete",
      label: "Restore",
      icon: ArrowUturnUpIcon,
      onClick: () => undeleteFilesMutation.mutate({ file_id: data.file_id }),
      isPending: undeleteFilesMutation.isPending,
    });
  } else {
    managementActions.push({
      id: "delete",
      label: "Trash",
      icon: TrashIcon,
      onClick: () => deleteFilesMutation.mutate({ file_id: data.file_id }),
      variant: "destructive",
      isPending: deleteFilesMutation.isPending,
    });
  }

  if (data.is_inbox) {
    managementActions.push({
      id: "archive",
      label: "Archive",
      icon: ArchiveBoxArrowDownIcon,
      onClick: () => archiveFilesMutation.mutate({ file_id: data.file_id }),
      isPending: archiveFilesMutation.isPending,
    });
  } else {
    managementActions.push({
      id: "unarchive",
      label: "Re-inbox",
      icon: InboxArrowDownIcon,
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
    groups.push({
      id: "external",
      actions: [
        {
          id: "download",
          label: "Download",
          icon: ArrowDownTrayIcon,
          onClick: () => {
            window.location.href = downloadUrl;
          },
          href: downloadUrl,
          download: true,
          overflowOnly: true,
        },
        {
          id: "open-new-tab",
          label: `View ${data.ext || data.filetype_human}`,
          icon: ArrowTopRightOnSquareIcon,
          onClick: () => {
            window.open(fileUrl, "_blank", "noopener,noreferrer");
          },
          href: fileUrl,
          external: true,
          overflowOnly: true,
        },
      ],
    });
  }

  return groups;
}
