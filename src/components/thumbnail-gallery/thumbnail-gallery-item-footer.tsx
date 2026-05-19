// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconBan,
  IconClock,
  IconEye,
  IconHistory,
  IconMailFilled,
  IconMovie,
  IconNotes,
  IconTrashFilled,
  IconVolume,
} from "@tabler/icons-react";

import { useThumbnailGalleryContext } from "./thumbnail-gallery-context";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import {
  formatBytes,
  formatRelativeTimeCompact,
  formatViewtimeCompact,
} from "@/lib/format-utils";

interface ThumbnailGalleryItemFooterProps {
  item: FileMetadata;
}

export function ThumbnailGalleryItemFooter({
  item,
}: ThumbnailGalleryItemFooterProps) {
  const { infoMode, localHistoryEntries } = useThumbnailGalleryContext();
  const infoContent = getInfoContent(item, infoMode, localHistoryEntries);

  return (
    <div className="bg-muted text-muted-foreground flex h-6 shrink-0 items-center gap-0.5 px-0.5 text-[8px] @[150px]:gap-1 @[150px]:px-1 @[150px]:text-xs">
      {item.mime.startsWith("video/") && (
        <IconMovie
          className="size-2 @[60px]:size-3 @[150px]:size-4"
          aria-label="Video"
        />
      )}
      {item.has_audio && (
        <IconVolume
          className="size-2 @[60px]:size-3 @[150px]:size-4"
          aria-label="Has audio"
        />
      )}
      {infoContent}
      <span className="flex-1" />
      {item.notes && Object.keys(item.notes).length > 0 && (
        <IconNotes
          className="size-2 @[60px]:size-3 @[150px]:size-4"
          aria-label="Has notes"
        />
      )}
      {item.is_inbox && (
        <IconMailFilled
          className="text-foreground size-2 @[60px]:size-3 @[150px]:size-4"
          aria-label="In inbox"
        />
      )}
      {item.is_trashed && (
        <IconTrashFilled
          className="text-destructive size-2 @[60px]:size-3 @[150px]:size-4"
          aria-label="Trashed"
        />
      )}
      {item.is_deleted && !item.is_trashed && (
        <IconBan
          className="text-destructive size-2 @[60px]:size-3 @[150px]:size-4"
          aria-label="Permanently deleted"
        />
      )}
    </div>
  );
}

function getInfoContent(
  item: FileMetadata,
  infoMode: ReturnType<typeof useThumbnailGalleryContext>["infoMode"],
  localHistoryEntries:
    | ReturnType<typeof useThumbnailGalleryContext>["localHistoryEntries"]
    | undefined,
): React.ReactNode {
  switch (infoMode) {
    case "filesize": {
      const fileSize = formatBytes(item.size);
      if (!fileSize) return null;
      return (
        <span
          className="hidden @[100px]:inline"
          aria-label={`File size: ${fileSize}`}
        >
          {fileSize}
        </span>
      );
    }

    case "views": {
      const totalViews = item.file_viewing_statistics?.reduce(
        (sum, stat) => sum + stat.views,
        0,
      );
      if (!totalViews || totalViews === 0) return null;
      return (
        <span
          className="hidden items-center gap-0.5 @[100px]:inline-flex"
          aria-label={`${totalViews} views`}
        >
          <IconEye className="size-2 @[150px]:size-3" />
          {totalViews}
        </span>
      );
    }

    case "viewtime": {
      const totalViewtime = item.file_viewing_statistics?.reduce(
        (sum, stat) => sum + stat.viewtime,
        0,
      );
      if (!totalViewtime || totalViewtime === 0) return null;
      return (
        <span
          className="hidden items-center gap-0.5 @[100px]:inline-flex"
          aria-label={`${formatViewtimeCompact(totalViewtime)} watched`}
        >
          <IconClock className="size-2 @[150px]:size-3" />
          {formatViewtimeCompact(totalViewtime)}
        </span>
      );
    }

    case "lastViewedLocal": {
      const entry = localHistoryEntries?.find((e) => e.fileId === item.file_id);
      if (!entry) return null;
      const relativeTime = formatRelativeTimeCompact(entry.viewedAt);
      return (
        <span
          className="hidden items-center gap-0.5 @[100px]:inline-flex"
          aria-label={`Last viewed: ${relativeTime}`}
        >
          <IconHistory className="size-2 @[150px]:size-3" />
          {relativeTime}
        </span>
      );
    }

    case "lastViewedRemote": {
      const lastViewed = item.file_viewing_statistics?.reduce<number | null>(
        (latest, stat) => {
          if (stat.last_viewed_timestamp === null) return latest;
          if (latest === null) return stat.last_viewed_timestamp;
          return Math.max(latest, stat.last_viewed_timestamp);
        },
        null,
      );
      if (!lastViewed) return null;
      const relativeTime = formatRelativeTimeCompact(lastViewed * 1000);
      return (
        <span
          className="hidden items-center gap-0.5 @[100px]:inline-flex"
          aria-label={`Last viewed: ${relativeTime}`}
        >
          <IconHistory className="size-2 @[150px]:size-3" />
          {relativeTime}
        </span>
      );
    }

    default:
      return null;
  }
}
