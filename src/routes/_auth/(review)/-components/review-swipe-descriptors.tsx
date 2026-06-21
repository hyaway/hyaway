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
  TagSecondarySwipeAction,
  TagSwipeAction,
  ValidRatingSecondarySwipeAction,
  ValidRatingSwipeAction,
  ValidSecondarySwipeAction,
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
  /** Short label without rating service names (for small screens) */
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

/** Extract rating actions from secondary actions array */
function getRatingActions(
  secondaryActions?: Array<ValidSecondarySwipeAction>,
): Array<ValidRatingSwipeAction> {
  if (!secondaryActions) return [];
  return secondaryActions
    .filter(
      (action): action is ValidRatingSecondarySwipeAction =>
        action.actionType === "rating",
    )
    .map(({ actionType: _, ...rest }) => rest);
}

function getTagActions(
  secondaryActions?: Array<ValidSecondarySwipeAction>,
): Array<TagSwipeAction> {
  if (!secondaryActions) return [];
  return secondaryActions
    .filter(
      (action): action is TagSecondarySwipeAction =>
        action.actionType === "tag",
    )
    .map(({ actionType: _, ...rest }) => rest);
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

/**
 * Format a rating action as a display string.
 * Examples: "favorite like", "mynumeric 7/10", "myinc +1"
 *
 * @param action The rating action to format
 * @param ratingServices Optional map of serviceKey -> RatingServiceInfo for display
 */
export function formatRatingAction(
  action: ValidRatingSwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  const service = ratingServices?.get(action.serviceKey);
  const serviceName = truncate(service?.name ?? action.serviceKey, 20);
  const valueStr = getRatingValueString(action, ratingServices);
  return `${serviceName} ${valueStr}`;
}

/**
 * Format a rating action as a short string (without service name).
 * Examples: "like", "7/10", "+1"
 */
export function formatRatingActionShort(
  action: ValidRatingSwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  return getRatingValueString(action, ratingServices);
}

export function formatTagAction(
  action: TagSwipeAction,
  tagServices?: Map<string, LocalTagServiceInfo>,
): string {
  const service = tagServices?.get(action.serviceKey);
  const serviceName = truncate(service?.name ?? action.serviceKey, 20);
  const tag = truncate(action.tag, 20);
  const preposition = action.type === "add" ? "to" : "from";
  return `${action.type} ${tag} ${preposition} ${serviceName}`;
}

export function formatTagActionShort(action: TagSwipeAction): string {
  const prefix = action.type === "add" ? "+" : "-";
  return `${prefix}${truncate(action.tag, 16)}`;
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
  const ratingActions = getRatingActions(validSecondaryActions);
  const tagActions = getTagActions(validSecondaryActions);
  const actionLabels: Array<string> = [];
  const shortActionLabels: Array<string> = [];
  const secondaryActionCount = ratingActions.length + tagActions.length;

  if (secondaryActionCount > 1) {
    const labelParts: Array<string> = [];
    const shortLabelParts: Array<string> = [];

    if (ratingActions.length > 0) {
      labelParts.push(
        `${ratingActions.length} rating${ratingActions.length === 1 ? "" : "s"}`,
      );
      shortLabelParts.push(`+${ratingActions.length}R`);
    }

    if (tagActions.length > 0) {
      labelParts.push(
        `${tagActions.length} tag${tagActions.length === 1 ? "" : "s"}`,
      );
      shortLabelParts.push(`+${tagActions.length}T`);
    }

    return {
      ...fileDescriptor,
      label: `${fileDescriptor.label} + ${labelParts.join(", ")}`,
      shortLabel: `${fileDescriptor.shortLabel} ${shortLabelParts.join(" ")}`,
    };
  }

  if (ratingActions.length > 0) {
    actionLabels.push(
      ...ratingActions.map((a) => formatRatingAction(a, ratingServices)),
    );
    shortActionLabels.push(
      ...ratingActions.map((a) => formatRatingActionShort(a, ratingServices)),
    );
  }

  if (tagActions.length > 0) {
    actionLabels.push(
      ...tagActions.map((a) => formatTagAction(a, tagServices)),
    );
    shortActionLabels.push(...tagActions.map(formatTagActionShort));
  }

  if (actionLabels.length > 0) {
    return {
      ...fileDescriptor,
      label: `${fileDescriptor.label} + ${actionLabels.join(", ")}`,
      shortLabel: `${fileDescriptor.shortLabel} ${shortActionLabels.join(",")}`,
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
