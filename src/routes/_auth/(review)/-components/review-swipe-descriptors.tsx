// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconArchive,
  IconArrowBackUp,
  IconPlayerTrackNext,
  IconTrash,
} from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
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
  /** Display label for the primary file action */
  primaryActionLabel: string;
  /** Display labels for valid secondary tag actions */
  secondaryTagActionLabels: Array<string>;
  /** Display labels for valid secondary rating actions */
  secondaryRatingActionLabels: Array<string>;
  /** Icon component to render */
  icon: Icon;
  /** Tailwind classes for the icon/text color */
  textClass: string;
  /** Tailwind classes for the background (used in overlays and badges) */
  bgClass: string;
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

function formatRatingActionFull(
  action: ValidRatingSwipeAction,
  ratingServices?: Map<string, RatingServiceInfo>,
): string {
  const service = ratingServices?.get(action.serviceKey);
  const valueStr = getRatingValueString(action, ratingServices);
  return `${service?.name ?? action.serviceKey}: ${valueStr}`;
}

function formatTagActionFull(action: ValidTagSwipeAction): string {
  const prefix = action.type === "add" ? "+" : "-";
  return `${prefix}${action.tag}`;
}

function getSecondaryActionLabelsByType(
  actions: Array<ValidSecondarySwipeAction>,
  ratingServices?: Map<string, RatingServiceInfo>,
) {
  const allLabels: Array<string> = [];
  const tagLabels: Array<string> = [];
  const ratingLabels: Array<string> = [];

  for (const action of actions) {
    if (action.actionType === "rating") {
      const label = formatRatingActionFull(action, ratingServices);
      allLabels.push(label);
      ratingLabels.push(label);
      continue;
    }

    const label = formatTagActionFull(action);
    allLabels.push(label);
    tagLabels.push(label);
  }

  return { allLabels, tagLabels, ratingLabels };
}

/** Base descriptor without styling (shared between normal and overlay) */
interface BaseDescriptor {
  label: string;
  icon: Icon;
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
    primaryActionLabel: base.label,
    secondaryTagActionLabels: [],
    secondaryRatingActionLabels: [],
    icon: base.icon,
    ...style,
  };
  const validSecondaryActions = getValidSecondarySwipeActions(binding, {
    localTagServicesByKey: tagServices,
    ratingServicesByKey: ratingServices,
  });
  const {
    allLabels: secondaryActionLabels,
    tagLabels: secondaryTagActionLabels,
    ratingLabels: secondaryRatingActionLabels,
  } = getSecondaryActionLabelsByType(validSecondaryActions, ratingServices);
  const fileLabelPrefix =
    binding.fileAction === "skip" ? "" : fileDescriptor.label;

  if (secondaryActionLabels.length > 0) {
    const actionLabel = secondaryActionLabels.join("\n");

    return {
      ...fileDescriptor,
      secondaryTagActionLabels,
      secondaryRatingActionLabels,
      label: fileLabelPrefix
        ? `${fileLabelPrefix}\n${actionLabel}`
        : actionLabel,
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
