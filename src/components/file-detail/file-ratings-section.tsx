// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { IconTallymarks } from "@tabler/icons-react";

import type {
  FileMetadata,
  RatingValue,
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import { Permission, ServiceType } from "@/integrations/hydrus-api/models";
import { Heading } from "@/components/ui-primitives/heading";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Heading level={2}>Ratings</Heading>
        {!canEditRatings && (
          <span className="text-muted-foreground text-xs">
            (read-only, no 'Edit file ratings' permission)
          </span>
        )}
      </div>
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
    <div className="bg-muted/50 flex flex-wrap items-center gap-3 rounded-lg border p-3">
      {/* Large icon spanning both text lines */}
      {service.type === ServiceType.RATING_INC_DEC ? (
        <IconTallymarks className="text-muted-foreground size-8 shrink-0" />
      ) : (
        <FilledServiceIcon className="text-muted-foreground size-8 shrink-0" />
      )}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
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
            serviceKey={serviceKey}
            starShape={service.star_shape}
            onChange={handleSetRating}
            disabled={disabled || isPending}
          />
        )}
        {service.type === ServiceType.RATING_NUMERICAL && (
          <NumericalRatingControl
            value={currentRating as number | null}
            minStars={service.min_stars ?? 0}
            maxStars={service.max_stars ?? 5}
            serviceKey={serviceKey}
            starShape={service.star_shape}
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
