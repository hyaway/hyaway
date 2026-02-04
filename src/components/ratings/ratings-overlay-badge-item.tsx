// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { RatingsOverlayBadge } from "./ratings-overlay-badge";
import type {
  RatingServiceInfo,
  RatingValue,
} from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";

export type RatingsOverlayBadgeSize = "sm" | "md" | "lg";

type RatingsOverlayBadgeVariant = "overlay" | "thumbnail";

interface RatingsOverlayBadgeItemProps {
  serviceKey: string;
  service: RatingServiceInfo;
  value: RatingValue;
  variant: RatingsOverlayBadgeVariant;
  size?: RatingsOverlayBadgeSize;
}

export function RatingsOverlayBadgeItem({
  serviceKey,
  service,
  value,
  variant,
  size = "md",
}: RatingsOverlayBadgeItemProps) {
  const isOverlay = variant === "overlay";

  const iconClassName = isOverlay
    ? cn(
        size === "sm" && "size-2.5",
        size === "md" && "size-3.5",
        size === "lg" && "size-4",
      )
    : "size-2.5 shrink-0 align-middle @[100px]:size-3 @[150px]:size-3.5";

  const badgeClassName = isOverlay
    ? cn(
        "bg-card/80 flex items-center rounded-xs leading-none font-bold tabular-nums dark:font-semibold",
        size === "sm" && "gap-0.5 px-0.5 py-px text-[8px]",
        size === "md" && "gap-1 px-1.5 py-0.5 text-xs",
        size === "lg" && "gap-1.5 px-2 py-1 text-sm",
      )
    : "flex items-center gap-0.5 rounded-xs bg-card/80 px-0.5 py-0.25 text-[8px] leading-none text-foreground @[100px]:gap-0.5 @[100px]:px-1 @[100px]:text-[10px] @[150px]:gap-1 @[150px]:px-1.5 @[150px]:text-xs font-bold dark:font-semibold tabular-nums";

  return (
    <RatingsOverlayBadge
      serviceKey={serviceKey}
      service={service}
      value={value}
      badgeClassName={badgeClassName}
      iconClassName={iconClassName}
      crossedOutBackslashClassName={
        isOverlay ? undefined : "-inset-[25%] size-[150%]"
      }
    />
  );
}
