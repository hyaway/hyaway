// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { RatingsOverlayBadge } from "./ratings-overlay-badge";
import type {
  RatingServiceInfo,
  RatingValue,
} from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";

export type RatingsOverlayBadgeSize = "sm" | "md" | "lg";

interface RatingsOverlayBadgeItemProps {
  serviceKey: string;
  service: RatingServiceInfo;
  value: RatingValue;
  size: RatingsOverlayBadgeSize;
  className?: string;
}

export function RatingsOverlayBadgeItem({
  serviceKey,
  service,
  value,
  size,
  className,
}: RatingsOverlayBadgeItemProps) {
  const iconClassName = cn(
    size === "sm" && "size-3.5",
    size === "md" && "size-3.5",
    size === "lg" && "size-4",
  );

  const badgeClassName = cn(
    "flex items-center leading-none font-bold tabular-nums dark:font-semibold",
    size === "sm" && "gap-1 px-1.5 py-0.5 text-xs",
    size === "md" && "gap-1 px-1.5 py-0.5 text-xs",
    size === "lg" && "gap-1.5 px-2 py-1 text-sm",
    className,
  );

  return (
    <RatingsOverlayBadge
      serviceKey={serviceKey}
      service={service}
      value={value}
      badgeClassName={badgeClassName}
      iconClassName={iconClassName}
    />
  );
}
