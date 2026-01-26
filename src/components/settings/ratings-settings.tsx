// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { IconTallymarks, IconX } from "@tabler/icons-react";
import { SwitchField } from "./setting-fields";
import { Permission, ServiceType } from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import {
  useRatingsServiceSettings,
  useRatingsSettingsActions,
} from "@/stores/ratings-settings-store";
import { Button } from "@/components/ui-primitives/button";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";

export const RATINGS_SETTINGS_TITLE = "Ratings";

export interface RatingsSettingsProps {
  idPrefix?: string;
  /** Whether to show the "Show in review" setting. Default true. */
  showReviewSetting?: boolean;
}

/**
 * Unified settings for controlling rating visibility in overlays and review mode.
 */
export function RatingsSettings({
  idPrefix = "",
  showReviewSetting = true,
}: RatingsSettingsProps) {
  const { ratingServices: ratingServicesRaw } = useRatingServices();
  const ratingsServiceSettings = useRatingsServiceSettings();
  const {
    setShowInOverlay,
    setShowInOverlayEvenWhenNull,
    setShowInReview,
    removeServiceSettings,
  } = useRatingsSettingsActions();
  const { hasPermission } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);

  // Get rating services for settings UI
  const ratingServices = useMemo(
    () =>
      ratingServicesRaw.map(([serviceKey, service]) => ({
        serviceKey,
        name: service.name,
        type: service.type,
        starShape: service.star_shape,
      })),
    [ratingServicesRaw],
  );

  // Find orphaned services (in settings but no longer in Hydrus)
  const orphanedServices = useMemo(() => {
    const activeServiceKeys = new Set(ratingServices.map((s) => s.serviceKey));
    return Object.keys(ratingsServiceSettings).filter(
      (key) => !activeServiceKeys.has(key),
    );
  }, [ratingServices, ratingsServiceSettings]);

  if (ratingServices.length === 0 && orphanedServices.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No rating services configured in Hydrus.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {ratingServices.map(({ serviceKey, name, type, starShape }) => {
        const settings = ratingsServiceSettings[serviceKey] ?? {
          showInOverlay: true,
          showInOverlayEvenWhenNull: false,
          showInReview: true,
        };
        return (
          <RatingServiceRow
            key={serviceKey}
            serviceKey={serviceKey}
            name={name}
            type={type}
            starShape={starShape}
            showInOverlay={settings.showInOverlay}
            showInOverlayEvenWhenNull={settings.showInOverlayEvenWhenNull}
            showInReview={settings.showInReview}
            showReviewSetting={showReviewSetting}
            canEditRatings={canEditRatings}
            idPrefix={idPrefix}
            onShowInOverlayChange={(checked) =>
              setShowInOverlay(serviceKey, checked)
            }
            onShowWhenNullChange={(checked) =>
              setShowInOverlayEvenWhenNull(serviceKey, checked)
            }
            onShowInReviewChange={(checked) =>
              setShowInReview(serviceKey, checked)
            }
          />
        );
      })}

      {/* Orphaned services */}
      {orphanedServices.map((serviceKey) => (
        <div
          key={serviceKey}
          className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-dashed p-3 opacity-60"
        >
          <div className="flex grow flex-col">
            <span className="text-sm font-medium line-through">
              {serviceKey.slice(0, 8)}...
            </span>
            <span className="text-muted-foreground text-xs">
              Service no longer exists
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeServiceSettings(serviceKey)}
            aria-label="Remove orphaned service settings"
          >
            <IconX className="size-4" />
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}

interface RatingServiceRowProps {
  serviceKey: string;
  name: string;
  type: ServiceType;
  starShape?: string;
  showInOverlay: boolean;
  showInOverlayEvenWhenNull: boolean;
  showInReview: boolean;
  showReviewSetting: boolean;
  canEditRatings: boolean;
  idPrefix: string;
  onShowInOverlayChange: (checked: boolean) => void;
  onShowWhenNullChange: (checked: boolean) => void;
  onShowInReviewChange: (checked: boolean) => void;
}

function RatingServiceRow({
  serviceKey,
  name,
  type,
  starShape,
  showInOverlay,
  showInOverlayEvenWhenNull,
  showInReview,
  showReviewSetting,
  canEditRatings,
  idPrefix,
  onShowInOverlayChange,
  onShowWhenNullChange,
  onShowInReviewChange,
}: RatingServiceRowProps) {
  const { filled: FilledIcon } = useShapeIcons(serviceKey, starShape);

  const typeLabel =
    type === ServiceType.RATING_LIKE
      ? "Like / Dislike"
      : type === ServiceType.RATING_NUMERICAL
        ? "Numerical"
        : "Inc / Dec";

  const whenNullLabel =
    type === ServiceType.RATING_INC_DEC ? "Show when zero" : "Show when unset";

  const whenNullDescription =
    type === ServiceType.RATING_INC_DEC
      ? "Display in overlay even when count is zero"
      : "Display in overlay even when not rated";

  return (
    <div className="bg-muted/50 hover:bg-muted flex flex-col gap-3 rounded-lg border p-3 transition-colors">
      <div className="flex items-center gap-2">
        {type === ServiceType.RATING_INC_DEC ? (
          <IconTallymarks className="text-muted-foreground size-6 shrink-0" />
        ) : (
          <FilledIcon className="text-muted-foreground size-6 shrink-0" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-muted-foreground text-xs">{typeLabel}</span>
        </div>
      </div>
      <SwitchField
        id={`${idPrefix}rating-${serviceKey}-overlay`}
        label="Show overlay"
        description="Display rating on gallery thumbnails and in file viewers"
        checked={showInOverlay}
        onCheckedChange={onShowInOverlayChange}
      />
      <SwitchField
        id={`${idPrefix}rating-${serviceKey}-show-null`}
        label={whenNullLabel}
        description={whenNullDescription}
        checked={showInOverlayEvenWhenNull}
        onCheckedChange={onShowWhenNullChange}
        disabled={!showInOverlay}
      />
      {showReviewSetting && (
        <SwitchField
          id={`${idPrefix}rating-${serviceKey}-review`}
          label="Show in review"
          description={
            canEditRatings
              ? "Display rating button in review mode footer"
              : "Disabled: missing 'Edit file ratings' permission"
          }
          checked={showInReview && canEditRatings}
          disabled={!canEditRatings}
          onCheckedChange={onShowInReviewChange}
        />
      )}
    </div>
  );
}
