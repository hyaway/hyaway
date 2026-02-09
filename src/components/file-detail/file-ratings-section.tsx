// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTimeline } from "@tabler/icons-react";

import type {
  FileMetadata,
  RatingServiceInfo,
  RatingValue,
} from "@/integrations/hydrus-api/models";
import {
  Permission,
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { SectionHeading } from "@/components/page-shell/section-heading";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import {
  getDislikeColors,
  getIncDecPositiveColors,
  getLikeColors,
  getNumericalFilledColors,
} from "@/components/ratings/rating-colors";
import {
  IncDecRatingControl,
  LikeDislikeControl,
  NumericalRatingControl,
} from "@/components/ratings/rating-controls";

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
    <div className="flex flex-col gap-4">
      <SectionHeading
        title="Ratings"
        suffix={
          !canEditRatings
            ? "(read-only, no 'Edit file ratings' permission)"
            : null
        }
      />
      <div className="flex flex-col gap-3">
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
  service: RatingServiceInfo;
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

  // Get icons for this service - handles both predefined shapes and custom SVGs
  const { filled: FilledServiceIcon } = useShapeIcons(
    serviceKey,
    service.star_shape,
  );

  const handleSetRating = (rating: RatingValue) => {
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating,
    });
  };

  const iconColor = isIncDecRatingService(service)
    ? getIncDecPositiveColors(service)?.brush
    : isNumericalRatingService(service)
      ? getNumericalFilledColors(service).brush
      : getLikeColors(service).brush;

  // Format the current rating for display in the title
  const getRatingDisplay = () => {
    if (isLikeRatingService(service)) {
      const value = currentRating as boolean | null;
      if (value === true) return "liked";
      if (value === false) return "disliked";
      return "no rating";
    }
    if (isNumericalRatingService(service)) {
      const value = currentRating as number | null;
      const max = service.max_stars;
      return value === null ? `-/${max}` : `${value}/${max}`;
    }
    // Inc/Dec
    return String(currentRating ?? 0);
  };

  return (
    <div className="bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg border p-3 transition-colors">
      <div className="flex min-w-0 items-center gap-2">
        {isIncDecRatingService(service) ? (
          <IconTimeline
            className="size-6 shrink-0"
            style={iconColor ? { color: iconColor } : undefined}
          />
        ) : (
          <FilledServiceIcon
            className="size-6 shrink-0"
            style={
              iconColor ? { color: iconColor, stroke: iconColor } : undefined
            }
          />
        )}
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-x-1.5">
            <span className="text-sm font-medium">{service.name}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              ({getRatingDisplay()})
            </span>
          </div>
          <span className="text-muted-foreground text-xs">
            {service.type_pretty}
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isLikeRatingService(service) && (
          <LikeDislikeControl
            value={currentRating as boolean | null}
            serviceKey={serviceKey}
            starShape={service.star_shape}
            onChange={handleSetRating}
            disabled={disabled || isPending}
            likeColors={getLikeColors(service)}
            dislikeColors={getDislikeColors(service)}
          />
        )}
        {isNumericalRatingService(service) && (
          <NumericalRatingControl
            value={currentRating as number | null}
            minStars={service.min_stars}
            maxStars={service.max_stars}
            serviceKey={serviceKey}
            starShape={service.star_shape}
            onChange={handleSetRating}
            disabled={disabled || isPending}
            filledColors={getNumericalFilledColors(service)}
          />
        )}
        {isIncDecRatingService(service) && (
          <IncDecRatingControl
            value={currentRating as number}
            onChange={handleSetRating}
            disabled={disabled || isPending}
            service={service}
          />
        )}
      </div>
    </div>
  );
}
