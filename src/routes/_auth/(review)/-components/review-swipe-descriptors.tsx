// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconArrowBackUp,
  IconPlayerTrackNext,
  IconTrash,
} from "@tabler/icons-react";
import type {
  ReviewFileAction,
  ReviewSwipeBinding,
  ValidRatingSwipeAction,
  ValidSecondarySwipeAction,
  ValidTagSwipeAction,
} from "@/stores/review-settings-store";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import { getValidSecondarySwipeActions } from "@/stores/review-settings-store";
import { isNumericalRatingService } from "@/integrations/hydrus-api/models";

/** Visual descriptor for a swipe binding */
export interface SwipeBindingDescriptor {
  /** Display label for the binding */
  label: string;
  /** Dense label for compact surfaces like mobile inline stats */
  shortLabel: string;
  /** Icon component to render */
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon/text color */
  textClass: string;
  /** Tailwind classes for the background (used in overlays and badges) */
  bgClass: string;
}

/** Truncate a string to maxLength, adding ellipsis if needed */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str
    .trim()
    .slice(0, maxLength - 1)
    .trim()}`;
}

/**
 * Get the rating value portion of a rating action.
 * Examples: "like", "7/10", "+1"
 */
function getRatingValueString(
  action: ValidRatingSwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  const service = ratingServices?.get(action.serviceKey);

  switch (action.type) {
    case "setLike":
      if (action.value === true) return "like";
      if (action.value === false) return "dislike";
      return "clear";
    case "setNumerical": {
      if (action.value === null) return "clear";
      const maxStars =
        service && isNumericalRatingService(service)
          ? service.max_stars
          : undefined;
      if (maxStars != null) return `${action.value}/${maxStars}`;
      return `${action.value}`;
    }
    case "incDecDelta":
      return action.delta > 0 ? "+1" : "-1";
  }
}

function getCompactServiceName(
  serviceName: string | undefined,
  fallback: string,
) {
  const normalized = (serviceName ?? fallback).trim().replace(/\s+/g, " ");
  return normalized.slice(0, 3) || fallback.slice(0, 3);
}

function formatRatingActionCompact(
  action: ValidRatingSwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  const service = ratingServices?.get(action.serviceKey);
  const serviceName = getCompactServiceName(service?.name, action.serviceKey);
  const valueStr = getRatingValueString(action, ratingServices);
  return `${serviceName} ${valueStr}`;
}

function formatRatingActionFull(
  action: ValidRatingSwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  const service = ratingServices?.get(action.serviceKey);
  const valueStr = getRatingValueString(action, ratingServices);
  return `${service?.name ?? action.serviceKey} ${valueStr}`;
}

function formatTagActionCompact(action: ValidTagSwipeAction): string {
  const prefix = action.type === "add" ? "+" : "-";
  return `${prefix}${truncate(action.tag, 16)}`;
}

function formatTagActionFull(action: ValidTagSwipeAction): string {
  const prefix = action.type === "add" ? "+" : "-";
  return `${prefix}${action.tag}`;
}

function formatSecondaryActionCompact(
  action: ValidSecondarySwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  if (action.actionType === "rating") {
    return formatRatingActionCompact(action, ratingServices);
  }

  return formatTagActionCompact(action);
}

function formatSecondaryActionFull(
  action: ValidSecondarySwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  if (action.actionType === "rating") {
    return formatRatingActionFull(action, ratingServices);
  }

  return formatTagActionFull(action);
}

/** Base descriptor without styling (shared between normal and overlay) */
interface BaseDescriptor {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Styling for a descriptor */
interface DescriptorStyle {
  textClass: string;
  bgClass: string;
}

/** Base descriptors for file actions (label + icon only) */
const FILE_ACTION_BASE: Record<ReviewFileAction, BaseDescriptor> = {
  archive: { label: "Archive", icon: IconArchive },
  trash: { label: "Trash", icon: IconTrash },
  skip: { label: "Skip", icon: IconPlayerTrackNext },
  undo: { label: "Undo", icon: IconArrowBackUp },
};

/** Normal styling for file actions */
const FILE_ACTION_STYLES: Record<ReviewFileAction, DescriptorStyle> = {
  archive: { textClass: "text-primary", bgClass: "bg-primary/10" },
  trash: { textClass: "text-destructive", bgClass: "bg-destructive/10" },
  skip: { textClass: "text-muted-foreground", bgClass: "bg-muted" },
  undo: { textClass: "text-muted-foreground", bgClass: "bg-muted" },
};

/** Overlay styling for file actions (stronger backgrounds) */
const FILE_ACTION_OVERLAY_STYLES: Record<ReviewFileAction, DescriptorStyle> = {
  archive: { textClass: "text-primary-foreground", bgClass: "bg-primary/80" },
  trash: { textClass: "text-white", bgClass: "bg-destructive/80" },
  skip: { textClass: "text-muted-foreground", bgClass: "bg-muted/80" },
  undo: { textClass: "text-muted-foreground", bgClass: "bg-muted/80" },
};

/** Internal helper to build a swipe binding descriptor */
function buildSwipeBindingDescriptor(
  binding: ReviewSwipeBinding,
  ratingServices: Map<string, RatingServiceInfo> | undefined,
  tagServices: Map<string, LocalTagServiceInfo> | undefined,
  styles: Record<ReviewFileAction, DescriptorStyle>,
): SwipeBindingDescriptor {
  const base = FILE_ACTION_BASE[binding.fileAction];
  const style = styles[binding.fileAction];
  const fileDescriptor: SwipeBindingDescriptor = {
    label: base.label,
    shortLabel: base.label,
    icon: base.icon,
    ...style,
  };
  const validSecondaryActions = getValidSecondarySwipeActions(binding, {
    localTagServicesByKey: tagServices,
    ratingServicesByKey: ratingServices,
  });
  const secondaryActionCount = validSecondaryActions.length;
  const fileLabelPrefix =
    binding.fileAction === "skip" ? "" : fileDescriptor.label;
  const shortFileLabelPrefix =
    binding.fileAction === "skip" ? "" : fileDescriptor.shortLabel;

  if (secondaryActionCount > 0) {
    const fullActionLabels = validSecondaryActions.map((action) =>
      formatSecondaryActionFull(action, ratingServices),
    );
    const compactActionLabels = validSecondaryActions.map((action) =>
      formatSecondaryActionCompact(action, ratingServices),
    );
    const actionLabel = fullActionLabels.join(", ");
    const shortActionLabel = compactActionLabels.join(",");

    return {
      ...fileDescriptor,
      label: fileLabelPrefix
        ? `${fileLabelPrefix} + ${actionLabel}`
        : actionLabel,
      shortLabel: shortFileLabelPrefix
        ? `${shortFileLabelPrefix} ${shortActionLabel}`
        : shortActionLabel,
    };
  }

  return fileDescriptor;
}

/**
 * Get a visual descriptor for a swipe binding.
 * Used for stats display and other UI elements.
 *
 * @param binding The swipe binding to describe
 * @param ratingServices Optional map of serviceKey -> RatingServiceInfo for display
 * @returns Descriptor with label, icon, and styling classes
 */
export function getSwipeBindingDescriptor(
  binding: ReviewSwipeBinding,
  ratingServices?: Map<string, RatingServiceInfo>,
  tagServices?: Map<string, LocalTagServiceInfo>,
): SwipeBindingDescriptor {
  return buildSwipeBindingDescriptor(
    binding,
    ratingServices,
    tagServices,
    FILE_ACTION_STYLES,
  );
}

/**
 * Get a visual descriptor for a swipe binding for use in overlays.
 * Uses stronger background colors suitable for overlay display.
 *
 * @param binding The swipe binding to describe
 * @param ratingServices Optional map of serviceKey -> RatingServiceInfo for display
 * @returns Descriptor with label, icon, and overlay styling classes
 */
export function getSwipeBindingOverlayDescriptor(
  binding: ReviewSwipeBinding,
  ratingServices?: Map<string, RatingServiceInfo>,
  tagServices?: Map<string, LocalTagServiceInfo>,
): SwipeBindingDescriptor {
  return buildSwipeBindingDescriptor(
    binding,
    ratingServices,
    tagServices,
    FILE_ACTION_OVERLAY_STYLES,
  );
}
