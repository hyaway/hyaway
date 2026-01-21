// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { IconX } from "@tabler/icons-react";
import { SwitchField } from "./setting-fields";
import { ServiceType } from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import {
  useRatingsDisplaySettingsActions,
  useRatingsServiceSettings,
} from "@/stores/ratings-display-settings-store";
import { Button } from "@/components/ui-primitives/button";

export const RATINGS_OVERLAY_SETTINGS_TITLE = "Ratings overlay";

export interface RatingsOverlaySettingsProps {
  idPrefix?: string;
}

/**
 * Settings for controlling which ratings appear in overlays.
 * Used in thumbnail gallery settings, file viewer settings, and review settings.
 */
export function RatingsOverlaySettings({
  idPrefix = "",
}: RatingsOverlaySettingsProps) {
  const { ratingServices: ratingServicesRaw } = useRatingServices();
  const ratingsServiceSettings = useRatingsServiceSettings();
  const {
    setServiceShowInThumbnail,
    setServiceShowEvenWhenNull,
    removeServiceSettings,
  } = useRatingsDisplaySettingsActions();

  // Get rating services for settings UI (map to include type for label logic)
  const ratingServices = useMemo(
    () =>
      ratingServicesRaw.map(([serviceKey, service]) => ({
        serviceKey,
        name: service.name,
        type: service.type,
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
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {ratingServices.map(({ serviceKey, name, type }) => {
        const settings = ratingsServiceSettings[serviceKey] ?? {
          show_in_thumbnail: false,
          show_in_thumbnail_even_when_null: false,
        };
        const whenLabel =
          type === ServiceType.RATING_INC_DEC ? "When zero" : "When unset";
        const typeLabel =
          type === ServiceType.RATING_LIKE
            ? "Like / Dislike"
            : type === ServiceType.RATING_NUMERICAL
              ? "Numerical"
              : "Inc / Dec";
        return (
          <div
            key={serviceKey}
            className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3"
          >
            <div className="flex grow flex-col">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-muted-foreground text-xs">{typeLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <SwitchField
                id={`${idPrefix}rating-${serviceKey}-show`}
                label="Show"
                checked={settings.show_in_thumbnail}
                onCheckedChange={(checked) =>
                  setServiceShowInThumbnail(serviceKey, checked)
                }
              />
              <SwitchField
                id={`${idPrefix}rating-${serviceKey}-show-null`}
                label={whenLabel}
                checked={settings.show_in_thumbnail_even_when_null}
                onCheckedChange={(checked) =>
                  setServiceShowEvenWhenNull(serviceKey, checked)
                }
                disabled={!settings.show_in_thumbnail}
              />
            </div>
          </div>
        );
      })}
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
