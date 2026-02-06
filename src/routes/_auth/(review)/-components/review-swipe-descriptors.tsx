// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconPlayerTrackNext,
  IconTrash,
} from "@tabler/icons-react";
import type {
  RatingSwipeAction,
  ReviewSwipeBinding,
  SecondarySwipeAction,
} from "@/stores/review-settings-store";

/** Visual descriptor for a swipe binding */
export interface SwipeBindingDescriptor {
  /** Display label for the binding */
  label: string;
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
  return `${str.slice(0, maxLength - 1)}…`;
}

/** Extract rating actions from secondary actions array */
function getRatingActions(
  secondaryActions?: Array<SecondarySwipeAction>,
): Array<RatingSwipeAction> {
  if (!secondaryActions) return [];
  return secondaryActions
    .filter(
      (a): a is SecondarySwipeAction & { actionType: "rating" } =>
        a.actionType === "rating",
    )
    .map(({ actionType: _, ...rest }) => rest as RatingSwipeAction);
}

/**
 * Format a rating action as a display string.
 * Examples: "favorite like", "mynumeric 7", "myinc +1"
 *
 * @param action The rating action to format
 * @param serviceNames Optional map of serviceKey -> serviceName for display
 */
export function formatRatingAction(
  action: RatingSwipeAction,
  serviceNames?: Map<string, string>,
): string {
  // Look up service name, fall back to key, truncate to 10 chars
  const serviceName = truncate(
    serviceNames?.get(action.serviceKey) ?? action.serviceKey,
    10,
  );

  switch (action.type) {
    case "setLike":
      if (action.value === true) return `${serviceName} like`;
      if (action.value === false) return `${serviceName} dislike`;
      return `${serviceName} clear`;
    case "setNumerical":
      if (action.value === null) return `${serviceName} clear`;
      return `${serviceName} ${action.value}`;
    case "incDecDelta":
      return `${serviceName} ${action.delta > 0 ? "+1" : "-1"}`;
  }
}

/** Descriptors for file actions */
const FILE_ACTION_DESCRIPTORS: Record<
  "archive" | "trash" | "skip",
  SwipeBindingDescriptor
> = {
  archive: {
    label: "Archive",
    icon: IconArchive,
    textClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  trash: {
    label: "Trash",
    icon: IconTrash,
    textClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
  skip: {
    label: "Skip",
    icon: IconPlayerTrackNext,
    textClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
};

/** Descriptors for file actions with stronger overlay backgrounds */
const FILE_ACTION_OVERLAY_DESCRIPTORS: Record<
  "archive" | "trash" | "skip",
  SwipeBindingDescriptor
> = {
  archive: {
    label: "Archive",
    icon: IconArchive,
    textClass: "text-primary-foreground",
    bgClass: "bg-primary/80",
  },
  trash: {
    label: "Trash",
    icon: IconTrash,
    textClass: "text-white",
    bgClass: "bg-destructive/80",
  },
  skip: {
    label: "Skip",
    icon: IconPlayerTrackNext,
    textClass: "text-muted-foreground",
    bgClass: "bg-muted/80",
  },
};

/**
 * Get a visual descriptor for a swipe binding.
 * Used for stats display and other UI elements.
 *
 * @param binding The swipe binding to describe
 * @param serviceNames Optional map of serviceKey -> serviceName for display
 * @returns Descriptor with label, icon, and styling classes
 */
export function getSwipeBindingDescriptor(
  binding: ReviewSwipeBinding,
  serviceNames?: Map<string, string>,
): SwipeBindingDescriptor {
  const fileDescriptor = FILE_ACTION_DESCRIPTORS[binding.fileAction];
  const ratingActions = getRatingActions(binding.secondaryActions);

  // If there are also rating actions, append formatted ratings
  if (ratingActions.length > 0) {
    const ratingLabels = ratingActions
      .map((a) => formatRatingAction(a, serviceNames))
      .join(", ");
    return {
      ...fileDescriptor,
      label: `${fileDescriptor.label} + ${ratingLabels}`,
    };
  }

  return fileDescriptor;
}

/**
 * Get a visual descriptor for a swipe binding for use in overlays.
 * Uses stronger background colors suitable for overlay display.
 *
 * @param binding The swipe binding to describe
 * @param serviceNames Optional map of serviceKey -> serviceName for display
 * @returns Descriptor with label, icon, and overlay styling classes
 */
export function getSwipeBindingOverlayDescriptor(
  binding: ReviewSwipeBinding,
  serviceNames?: Map<string, string>,
): SwipeBindingDescriptor {
  const fileDescriptor = FILE_ACTION_OVERLAY_DESCRIPTORS[binding.fileAction];
  const ratingActions = getRatingActions(binding.secondaryActions);

  // If there are also rating actions, append formatted ratings
  if (ratingActions.length > 0) {
    const ratingLabels = ratingActions
      .map((a) => formatRatingAction(a, serviceNames))
      .join(", ");
    return {
      ...fileDescriptor,
      label: `${fileDescriptor.label} + ${ratingLabels}`,
    };
  }

  return fileDescriptor;
}
