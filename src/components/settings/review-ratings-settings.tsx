// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { IconTallymarks } from "@tabler/icons-react";
import { SwitchField } from "./setting-fields";
import { ServiceType } from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import {
  useReviewRatingsExcludedServices,
  useReviewRatingsSettingsActions,
} from "@/stores/review-ratings-settings-store";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";

export const REVIEW_RATINGS_SETTINGS_TITLE = "Review ratings buttons";

export interface ReviewRatingsSettingsProps {
  idPrefix?: string;
}

/**
 * Settings for selecting which rating services to show in review mode.
 * Default is all services enabled.
 */
export function ReviewRatingsSettings({
  idPrefix = "",
}: ReviewRatingsSettingsProps) {
  const { ratingServices } = useRatingServices();
  const excludedServices = useReviewRatingsExcludedServices();
  const { toggleService } = useReviewRatingsSettingsActions();

  // Map services to include display info
  const services = useMemo(
    () =>
      ratingServices.map(([serviceKey, service]) => ({
        serviceKey,
        name: service.name,
        type: service.type,
        starShape: service.star_shape,
      })),
    [ratingServices],
  );

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No rating services configured in Hydrus.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {services.map(({ serviceKey, name, type, starShape }) => {
        const isEnabled = !excludedServices.has(serviceKey);
        const typeLabel =
          type === ServiceType.RATING_LIKE
            ? "Like / Dislike"
            : type === ServiceType.RATING_NUMERICAL
              ? "Numerical"
              : "Inc / Dec";

        return (
          <ReviewRatingServiceRow
            key={serviceKey}
            serviceKey={serviceKey}
            name={name}
            type={type}
            starShape={starShape}
            typeLabel={typeLabel}
            isEnabled={isEnabled}
            idPrefix={idPrefix}
            onToggle={() => toggleService(serviceKey)}
          />
        );
      })}
    </div>
  );
}

interface ReviewRatingServiceRowProps {
  serviceKey: string;
  name: string;
  type: ServiceType;
  starShape?: string;
  typeLabel: string;
  isEnabled: boolean;
  idPrefix: string;
  onToggle: () => void;
}

function ReviewRatingServiceRow({
  serviceKey,
  name,
  type,
  starShape,
  typeLabel,
  isEnabled,
  idPrefix,
  onToggle,
}: ReviewRatingServiceRowProps) {
  const { filled: FilledIcon } = useShapeIcons(serviceKey, starShape);

  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
      {/* Service icon */}
      {type === ServiceType.RATING_INC_DEC ? (
        <IconTallymarks className="text-muted-foreground size-6 shrink-0" />
      ) : (
        <FilledIcon className="text-muted-foreground size-6 shrink-0" />
      )}

      {/* Service info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        <span className="text-muted-foreground text-xs">{typeLabel}</span>
      </div>

      {/* Enable toggle */}
      <SwitchField
        id={`${idPrefix}review-rating-${serviceKey}`}
        label=""
        checked={isEnabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}
