// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconCircleDashed,
  IconCircleDashedNumber0,
  IconMinus,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from "@tabler/icons-react";

import type {
  FileMetadata,
  RatingValue,
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import { Permission, ServiceType } from "@/integrations/hydrus-api/models";
import { Heading } from "@/components/ui-primitives/heading";
import { Button } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";

interface FileRatingsSectionProps {
  data: FileMetadata;
}

export function FileRatingsSection({ data }: FileRatingsSectionProps) {
  const { ratingServices, isLoading: servicesLoading } = useRatingServices();
  const { hasPermission } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);

  if (servicesLoading || ratingServices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Heading level={2}>Ratings</Heading>
      <div className="space-y-3">
        {ratingServices.map(([serviceKey, service]) => (
          <RatingControl
            key={serviceKey}
            serviceKey={serviceKey}
            service={service}
            fileId={data.file_id}
            currentRating={data.ratings?.[serviceKey] ?? null}
            disabled={!canEditRatings}
          />
        ))}
      </div>
    </div>
  );
}

interface RatingControlProps {
  serviceKey: string;
  service: ServiceInfo;
  fileId: number;
  currentRating: RatingValue;
  disabled?: boolean;
}

function RatingControl({
  serviceKey,
  service,
  fileId,
  currentRating,
  disabled,
}: RatingControlProps) {
  const { mutate: setRating, isPending } = useSetRatingMutation();

  const handleSetRating = (rating: RatingValue) => {
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating,
    });
  };

  // Format the current rating for display in the title
  const getRatingDisplay = () => {
    if (service.type === ServiceType.RATING_LIKE) {
      const value = currentRating as boolean | null;
      if (value === true) return "liked";
      if (value === false) return "disliked";
      return "no rating";
    }
    if (service.type === ServiceType.RATING_NUMERICAL) {
      const value = currentRating as number | null;
      const max = service.max_stars ?? 5;
      return value === null ? `-/${max}` : `${value}/${max}`;
    }
    if (service.type === ServiceType.RATING_INC_DEC) {
      return String(currentRating ?? 0);
    }
    return null;
  };

  return (
    <div className="bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{service.name}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            ({getRatingDisplay()})
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          {service.type_pretty}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {service.type === ServiceType.RATING_LIKE && (
          <LikeDislikeControl
            value={currentRating as boolean | null}
            onChange={handleSetRating}
            disabled={disabled || isPending}
          />
        )}
        {service.type === ServiceType.RATING_NUMERICAL && (
          <NumericalRatingControl
            value={currentRating as number | null}
            minStars={service.min_stars ?? 0}
            maxStars={service.max_stars ?? 5}
            onChange={handleSetRating}
            disabled={disabled || isPending}
          />
        )}
        {service.type === ServiceType.RATING_INC_DEC && (
          <IncDecRatingControl
            value={currentRating as number}
            onChange={handleSetRating}
            disabled={disabled || isPending}
          />
        )}
      </div>
    </div>
  );
}

interface LikeDislikeControlProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
}

function LikeDislikeControl({
  value,
  onChange,
  disabled,
}: LikeDislikeControlProps) {
  const isLiked = value === true;
  const isDisliked = value === false;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-10 p-0",
          isLiked &&
            "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-500",
          !isLiked &&
            !disabled &&
            "hover:text-green-600 dark:hover:text-green-500",
        )}
        onClick={() => onChange(isLiked ? null : true)}
        disabled={disabled}
        aria-label={isLiked ? "Remove like" : "Like"}
      >
        {isLiked ? (
          <IconThumbUpFilled className="size-7" />
        ) : (
          <IconThumbUp className="size-7" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-10 p-0",
          isDisliked &&
            "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-500",
          !isDisliked &&
            !disabled &&
            "hover:text-red-600 dark:hover:text-red-500",
        )}
        onClick={() => onChange(isDisliked ? null : false)}
        disabled={disabled}
        aria-label={isDisliked ? "Remove dislike" : "Dislike"}
      >
        {isDisliked ? (
          <IconThumbDownFilled className="size-7" />
        ) : (
          <IconThumbDown className="size-7" />
        )}
      </Button>
    </div>
  );
}

interface NumericalRatingControlProps {
  value: number | null;
  minStars: number;
  maxStars: number;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

function NumericalRatingControl({
  value,
  minStars,
  maxStars,
  onChange,
  disabled,
}: NumericalRatingControlProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  const isZero = value === 0;
  const canSetZero = minStars === 0;

  const columns = Math.min(
    maxStars > 10 ? Math.ceil(maxStars / 2) : maxStars,
    10,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Zero star - outside grid, doesn't participate in reflow */}
      {canSetZero && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-auto flex-col gap-0.5 px-1.5 py-1",
            !disabled && "hover:text-destructive",
          )}
          onClick={() => onChange(value === 0 ? null : 0)}
          disabled={disabled}
          aria-label="0 stars"
        >
          {isZero ? (
            <IconCircleDashedNumber0 className="size-7 transition-transform [button:hover_&]:scale-125" />
          ) : (
            <IconCircleDashed className="size-7 transition-transform [button:hover_&]:scale-125" />
          )}
          <span className="text-muted-foreground text-xs tabular-nums">0</span>
        </Button>
      )}
      <div
        className="group/stars grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {stars.map((star) => {
          const isFilled = value !== null && star <= value;
          // Stars 1+ are always clickable when minStars is 0 or 1
          const isClickable = star >= minStars;

          return (
            <Button
              key={star}
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-auto flex-col gap-0.5 px-1.5 py-1",
                // Base filled state
                isFilled && "text-amber-600 dark:text-amber-500",
                !isFilled && isZero && "text-muted-foreground/50",
                !isClickable && "cursor-not-allowed opacity-30",
                // CSS hover: highlight this and all previous stars
                isClickable &&
                  !disabled &&
                  "[&:has(~button:hover)]:text-amber-600 dark:[&:has(~button:hover)]:text-amber-500 [&:hover]:text-amber-600 dark:[&:hover]:text-amber-500",
              )}
              onClick={() => {
                if (!isClickable) return;
                // Clicking the currently selected star clears the rating
                onChange(value === star ? null : star);
              }}
              disabled={disabled || !isClickable}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              {/* Show both icons, toggle visibility with CSS on hover */}
              <IconStarFilled
                className={cn(
                  "size-7 transition-transform",
                  isFilled ? "block" : "hidden",
                  // Show filled on hover
                  isClickable &&
                    !disabled &&
                    "[button:has(~button:hover)_&]:block [button:hover_&]:block [button:hover_&]:scale-125",
                  // Dim filled stars that come after hovered star
                  isFilled && !disabled && "[button:hover~button_&]:opacity-40",
                )}
              />
              <IconStar
                className={cn(
                  "size-7 transition-transform",
                  isFilled ? "hidden" : "block",
                  // Hide outline on hover
                  isClickable &&
                    !disabled &&
                    "[button:has(~button:hover)_&]:hidden [button:hover_&]:hidden",
                  // Scale up on direct hover (when not filled)
                  !isFilled &&
                    isClickable &&
                    !disabled &&
                    "[button:hover_&]:scale-125",
                )}
              />
              <span className="text-muted-foreground text-xs tabular-nums">
                {star}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface IncDecRatingControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function IncDecRatingControl({
  value,
  onChange,
  disabled,
}: IncDecRatingControlProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="size-9.5 p-0"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
        aria-label="Decrease"
      >
        <IconMinus className="size-6" />
      </Button>
      <span className="bg-muted min-w-10 rounded border px-2 py-1.5 text-center text-base tabular-nums">
        {value}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="size-9.5 p-0"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Increase"
      >
        <IconPlus className="size-6" />
      </Button>
    </div>
  );
}
