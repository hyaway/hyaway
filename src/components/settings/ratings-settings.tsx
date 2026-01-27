// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { IconTallymarks, IconX } from "@tabler/icons-react";
import { Permission, ServiceType } from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import {
  useRatingsServiceSettings,
  useRatingsSettingsActions,
} from "@/stores/ratings-settings-store";
import { Button } from "@/components/ui-primitives/button";
import { Switch } from "@/components/ui-primitives/switch";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import { cn } from "@/lib/utils";

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

  const getSettings = (serviceKey: string) =>
    ratingsServiceSettings[serviceKey] ?? {
      showInOverlay: true,
      showInOverlayEvenWhenNull: false,
      showInReview: true,
    };

  return (
    <div className="flex flex-col gap-6">
      {/* Show overlay setting */}
      <SettingGroup
        label="Show overlay"
        description="Display rating on gallery thumbnails and in file viewers"
      >
        {ratingServices.map(({ serviceKey, name, type, starShape }) => (
          <ServiceSwitch
            key={serviceKey}
            id={`${idPrefix}rating-${serviceKey}-overlay`}
            serviceKey={serviceKey}
            name={name}
            type={type}
            starShape={starShape}
            checked={getSettings(serviceKey).showInOverlay}
            onCheckedChange={(checked) => setShowInOverlay(serviceKey, checked)}
          />
        ))}
      </SettingGroup>

      {/* Show when unset/zero setting */}
      <SettingGroup
        label="Show when unset"
        description="Display in overlay even when not rated (or zero for counters)"
      >
        {ratingServices.map(({ serviceKey, name, type, starShape }) => {
          const settings = getSettings(serviceKey);
          return (
            <ServiceSwitch
              key={serviceKey}
              id={`${idPrefix}rating-${serviceKey}-show-null`}
              serviceKey={serviceKey}
              name={name}
              type={type}
              starShape={starShape}
              checked={settings.showInOverlayEvenWhenNull}
              onCheckedChange={(checked) =>
                setShowInOverlayEvenWhenNull(serviceKey, checked)
              }
              disabled={!settings.showInOverlay}
            />
          );
        })}
      </SettingGroup>

      {/* Button in review setting */}
      {showReviewSetting && (
        <SettingGroup
          label="Button in review"
          description={
            canEditRatings
              ? "Display rating button in review queue footer"
              : "Disabled: missing 'Edit file ratings' permission"
          }
        >
          {ratingServices.map(({ serviceKey, name, type, starShape }) => (
            <ServiceSwitch
              key={serviceKey}
              id={`${idPrefix}rating-${serviceKey}-review`}
              serviceKey={serviceKey}
              name={name}
              type={type}
              starShape={starShape}
              checked={getSettings(serviceKey).showInReview && canEditRatings}
              onCheckedChange={(checked) =>
                setShowInReview(serviceKey, checked)
              }
              disabled={!canEditRatings}
            />
          ))}
        </SettingGroup>
      )}

      {/* Orphaned services */}
      {orphanedServices.length > 0 && (
        <SettingGroup
          label="Orphaned services"
          description="Settings for services that no longer exist in Hydrus"
        >
          {orphanedServices.map((serviceKey) => (
            <div
              key={serviceKey}
              className="flex items-center justify-between gap-2 opacity-60"
            >
              <span className="text-sm line-through">
                {serviceKey.slice(0, 8)}...
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeServiceSettings(serviceKey)}
                aria-label="Remove orphaned service settings"
              >
                <IconX className="size-4" />
              </Button>
            </div>
          ))}
        </SettingGroup>
      )}
    </div>
  );
}

interface SettingGroupProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingGroup({ label, description, children }: SettingGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

interface ServiceSwitchProps {
  id: string;
  serviceKey: string;
  name: string;
  type: ServiceType;
  starShape?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ServiceSwitch({
  id,
  serviceKey,
  name,
  type,
  starShape,
  checked,
  onCheckedChange,
  disabled,
}: ServiceSwitchProps) {
  const { filled: FilledIcon } = useShapeIcons(serviceKey, starShape);

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg py-1",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div className="flex items-center gap-2">
        {type === ServiceType.RATING_INC_DEC ? (
          <IconTallymarks className="text-muted-foreground size-5 shrink-0" />
        ) : (
          <FilledIcon className="text-muted-foreground size-5 shrink-0" />
        )}
        <span className="text-sm">{name}</span>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </label>
  );
}
