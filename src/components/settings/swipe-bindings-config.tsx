// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconArchive,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconMinus,
  IconPlayerTrackNext,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import type {
  RatingSwipeAction,
  ReviewFileAction,
  ReviewSwipeBinding,
  SecondarySwipeAction,
  SwipeDirection,
} from "@/stores/review-settings-store";
import type {
  IncDecRatingServiceInfo,
  LikeRatingServiceInfo,
  NumericalRatingServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  DEFAULT_SWIPE_BINDINGS,
  SWIPE_DIRECTIONS,
  useReviewSettingsActions,
  useReviewSwipeBindings,
} from "@/stores/review-settings-store";
import {
  Permission,
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import {
  LikeDislikeControl,
  NumericalRatingControl,
} from "@/components/ratings/rating-controls";
import {
  getDislikeColors,
  getLikeColors,
  getNumericalFilledColors,
} from "@/components/ratings/rating-colors";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Button } from "@/components/ui-primitives/button";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui-primitives/alert";
import { SettingsResetButton } from "@/components/settings/settings-ui";
import { cn } from "@/lib/utils";

// #region Direction Config

const DIRECTION_CONFIG: Record<
  SwipeDirection,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  left: { label: "Swipe Left", icon: IconArrowLeft },
  right: { label: "Swipe Right", icon: IconArrowRight },
  up: { label: "Swipe Up", icon: IconArrowUp },
  down: { label: "Swipe Down", icon: IconArrowDown },
};

const FILE_ACTIONS: Array<{
  value: ReviewFileAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "archive", label: "Archive", icon: IconArchive },
  { value: "trash", label: "Trash", icon: IconTrash },
  { value: "skip", label: "Skip", icon: IconPlayerTrackNext },
];

/** Extract the first rating action from secondary actions */
function getRatingAction(
  secondaryActions?: Array<SecondarySwipeAction>,
): RatingSwipeAction | undefined {
  const ratingAction = secondaryActions?.find((a) => a.actionType === "rating");
  if (!ratingAction) return undefined;
  // Extract rating action fields (exclude actionType)
  const { actionType: _, ...rest } = ratingAction;
  return rest as RatingSwipeAction;
}

/** Create secondary actions array with a rating action */
function withRatingAction(
  secondaryActions: Array<SecondarySwipeAction> | undefined,
  ratingAction: RatingSwipeAction | undefined,
): Array<SecondarySwipeAction> | undefined {
  // Filter out existing rating actions
  const otherActions =
    secondaryActions?.filter((a) => a.actionType !== "rating") ?? [];

  if (!ratingAction) {
    return otherActions.length > 0 ? otherActions : undefined;
  }

  return [...otherActions, { actionType: "rating", ...ratingAction }];
}

// #endregion

// #region Rating Value Picker

interface RatingValuePickerProps {
  serviceKey: string;
  service: RatingServiceInfo;
  ratingAction: RatingSwipeAction | undefined;
  onRatingActionChange: (action: RatingSwipeAction | undefined) => void;
}

function RatingValuePicker({
  serviceKey,
  service,
  ratingAction,
  onRatingActionChange,
}: RatingValuePickerProps) {
  if (isLikeRatingService(service)) {
    return (
      <LikeRatingValuePicker
        serviceKey={serviceKey}
        service={service}
        ratingAction={ratingAction}
        onRatingActionChange={onRatingActionChange}
      />
    );
  }

  if (isNumericalRatingService(service)) {
    return (
      <NumericalRatingValuePicker
        serviceKey={serviceKey}
        service={service}
        ratingAction={ratingAction}
        onRatingActionChange={onRatingActionChange}
      />
    );
  }

  if (isIncDecRatingService(service)) {
    return (
      <IncDecRatingValuePicker
        serviceKey={serviceKey}
        service={service}
        ratingAction={ratingAction}
        onRatingActionChange={onRatingActionChange}
      />
    );
  }

  return null;
}

function LikeRatingValuePicker({
  serviceKey,
  service,
  ratingAction,
  onRatingActionChange,
}: {
  serviceKey: string;
  service: LikeRatingServiceInfo;
  ratingAction: RatingSwipeAction | undefined;
  onRatingActionChange: (action: RatingSwipeAction | undefined) => void;
}) {
  const isConfigured =
    ratingAction?.type === "setLike" && ratingAction.serviceKey === serviceKey;
  const currentValue = isConfigured ? ratingAction.value : undefined;

  const handleChange = (value: boolean | null) => {
    // Any selection (including null/clear) sets the action
    onRatingActionChange({
      type: "setLike",
      serviceKey,
      value,
    });
  };

  return (
    <LikeDislikeControl
      value={currentValue ?? null}
      serviceKey={serviceKey}
      starShape={service.star_shape}
      onChange={handleChange}
      size="compact"
      likeColors={getLikeColors(service)}
      dislikeColors={getDislikeColors(service)}
    />
  );
}

function NumericalRatingValuePicker({
  serviceKey,
  service,
  ratingAction,
  onRatingActionChange,
}: {
  serviceKey: string;
  service: NumericalRatingServiceInfo;
  ratingAction: RatingSwipeAction | undefined;
  onRatingActionChange: (action: RatingSwipeAction | undefined) => void;
}) {
  const isConfigured =
    ratingAction?.type === "setNumerical" &&
    ratingAction.serviceKey === serviceKey;
  const currentValue = isConfigured ? ratingAction.value : undefined;

  const handleChange = (value: number | null) => {
    // Any selection (including null/clear) sets the action
    onRatingActionChange({
      type: "setNumerical",
      serviceKey,
      value,
    });
  };

  return (
    <NumericalRatingControl
      value={currentValue ?? null}
      minStars={service.min_stars}
      maxStars={service.max_stars}
      serviceKey={serviceKey}
      starShape={service.star_shape}
      onChange={handleChange}
      size="compact"
      filledColors={getNumericalFilledColors(service)}
    />
  );
}

function IncDecRatingValuePicker({
  serviceKey,
  ratingAction,
  onRatingActionChange,
}: {
  serviceKey: string;
  service: IncDecRatingServiceInfo;
  ratingAction: RatingSwipeAction | undefined;
  onRatingActionChange: (action: RatingSwipeAction | undefined) => void;
}) {
  const currentDelta =
    ratingAction?.type === "incDecDelta" &&
    ratingAction.serviceKey === serviceKey
      ? ratingAction.delta
      : null;

  const handleDelta = (delta: 1 | -1) => {
    if (currentDelta === delta) {
      // Toggle off
      onRatingActionChange(undefined);
    } else {
      onRatingActionChange({
        type: "incDecDelta",
        serviceKey,
        delta,
      });
    }
  };

  // Custom toggle for +1/-1 selection
  return (
    <ToggleGroup
      value={currentDelta ? [String(currentDelta)] : []}
      onValueChange={(values) => {
        const value = values[0];
        if (value === "1") handleDelta(1);
        else if (value === "-1") handleDelta(-1);
        else onRatingActionChange(undefined);
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="-1" aria-label="Decrement">
        <IconMinus className="size-4" />
        <span>1</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="1" aria-label="Increment">
        <IconPlus className="size-4" />
        <span>1</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

// #endregion

// #region Direction Binding Editor

/** Create a default rating action for a service (like, max stars, +1) */
function createDefaultRatingAction(
  serviceKey: string,
  service: RatingServiceInfo,
): RatingSwipeAction {
  if (isLikeRatingService(service)) {
    return { type: "setLike", serviceKey, value: true };
  }
  if (isNumericalRatingService(service)) {
    return { type: "setNumerical", serviceKey, value: service.max_stars };
  }
  if (isIncDecRatingService(service)) {
    return { type: "incDecDelta", serviceKey, delta: 1 };
  }
  // Fallback
  return { type: "setLike", serviceKey, value: true };
}

/** Get a human-readable description of a rating action */
function getRatingActionLabel(action: RatingSwipeAction): string {
  switch (action.type) {
    case "setLike":
      if (action.value === true) return "Like";
      if (action.value === false) return "Dislike";
      return "Clear";
    case "setNumerical":
      if (action.value === null) return "Clear";
      return `${action.value} star${action.value !== 1 ? "s" : ""}`;
    case "incDecDelta":
      return action.delta === 1 ? "+1" : "-1";
  }
}

interface DirectionBindingEditorProps {
  direction: SwipeDirection;
  binding: ReviewSwipeBinding;
  ratingServices: Array<[string, RatingServiceInfo]>;
  canEditRatings: boolean;
  isModified: boolean;
  onBindingChange: (binding: ReviewSwipeBinding) => void;
  onReset: () => void;
}

function DirectionBindingEditor({
  direction,
  binding,
  ratingServices,
  canEditRatings,
  isModified,
  onBindingChange,
  onReset,
}: DirectionBindingEditorProps) {
  const config = DIRECTION_CONFIG[direction];
  const DirectionIcon = config.icon;

  // Extract current rating action from secondary actions
  const ratingAction = getRatingAction(binding.secondaryActions);

  // Track selected service key in local state (may differ from binding while user is picking value)
  const [selectedServiceKey, setSelectedServiceKey] = useState(
    ratingAction?.serviceKey ?? "",
  );

  // Sync local state when binding changes externally (e.g., reset)
  useEffect(() => {
    setSelectedServiceKey(ratingAction?.serviceKey ?? "");
  }, [ratingAction?.serviceKey]);

  const selectedService = ratingServices.find(
    ([key]) => key === selectedServiceKey,
  )?.[1];

  // Detect orphaned rating action (service no longer exists)
  const isOrphanedRating =
    ratingAction?.serviceKey != null &&
    !ratingServices.some(([key]) => key === ratingAction.serviceKey);

  const handleFileActionChange = (value: Array<string>) => {
    const fileAction = value[0] as ReviewFileAction | undefined;
    // File action is required, ignore attempts to clear
    if (!fileAction) {
      return;
    }
    onBindingChange({
      ...binding,
      fileAction,
    });
  };

  const handleServiceChange = (serviceKey: string) => {
    setSelectedServiceKey(serviceKey);
    if (!serviceKey) {
      // "None" selected - clear rating action
      onBindingChange({
        ...binding,
        secondaryActions: withRatingAction(binding.secondaryActions, undefined),
      });
    } else {
      // Service selected - set default rating action
      const service = ratingServices.find(([key]) => key === serviceKey)?.[1];
      if (service) {
        const defaultAction = createDefaultRatingAction(serviceKey, service);
        onBindingChange({
          ...binding,
          secondaryActions: withRatingAction(
            binding.secondaryActions,
            defaultAction,
          ),
        });
      }
    }
  };

  const handleRatingActionChange = (
    newRatingAction: RatingSwipeAction | undefined,
  ) => {
    onBindingChange({
      ...binding,
      secondaryActions: withRatingAction(
        binding.secondaryActions,
        newRatingAction,
      ),
    });
  };

  const hasRatingServices = ratingServices.length > 0;
  const canConfigureRating = canEditRatings && hasRatingServices;

  return (
    <div className="@container flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg border p-3 sm:p-4">
      {/* Direction Header */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DirectionIcon className="text-muted-foreground size-5" />
          <span className="font-medium">{config.label}</span>
        </div>
        {isModified && (
          <SettingsResetButton
            onReset={onReset}
            label={`Reset ${config.label}`}
          />
        )}
      </div>

      {/* File Action */}
      <div className="flex min-w-0 flex-col gap-2">
        <Label className="text-muted-foreground text-xs">File action</Label>
        <ToggleGroup
          value={[binding.fileAction]}
          onValueChange={handleFileActionChange}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          {FILE_ACTIONS.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label}>
              <Icon className="size-4" />
              <span className="hidden @[10rem]:inline">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Rating Action */}
      <div className="flex min-w-0 flex-col gap-2">
        <Label
          className={cn(
            "text-xs",
            canConfigureRating
              ? "text-muted-foreground"
              : "text-muted-foreground/50",
          )}
        >
          Rating action (optional)
        </Label>

        {!canConfigureRating ? (
          <span className="text-muted-foreground/50 text-xs">
            {!canEditRatings
              ? "No permission to edit ratings"
              : "No rating services available"}
          </span>
        ) : isOrphanedRating ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>Rating service does not exist</AlertTitle>
            <AlertDescription>
              Rating service {ratingAction.serviceKey} associated with this
              action was not found in services object.
            </AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRatingActionChange(undefined)}
              >
                Clear
              </Button>
            </AlertAction>
          </Alert>
        ) : (
          <div className="flex min-w-0 flex-col gap-2">
            {/* Service selector */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button
                    {...props}
                    variant="outline"
                    size="sm"
                    className="w-full min-w-0 justify-start"
                  >
                    <span className="truncate">
                      {selectedService?.name ?? "Select rating service..."}
                    </span>
                  </Button>
                )}
              />
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup
                  value={selectedServiceKey}
                  onValueChange={handleServiceChange}
                >
                  <DropdownMenuRadioItem value="">None</DropdownMenuRadioItem>
                  <DropdownMenuSeparator />
                  {ratingServices.map(([key, service]) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {service.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Rating value picker */}
            {selectedService && (
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-muted-foreground shrink-0 text-xs">
                    Set to:
                  </span>
                  <RatingValuePicker
                    serviceKey={selectedServiceKey}
                    service={selectedService}
                    ratingAction={ratingAction}
                    onRatingActionChange={handleRatingActionChange}
                  />
                </div>
                {ratingAction && (
                  <span className="text-muted-foreground text-xs">
                    Will set {selectedService.name} to:{" "}
                    <strong>{getRatingActionLabel(ratingAction)}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// #endregion

// #region Main Component

export interface SwipeBindingsConfigProps {
  className?: string;
  /** When true, shows the section header with title and description */
  showHeader?: boolean;
  /** When true, disables all interactive elements */
  disabled?: boolean;
  /** Number of columns for direction editors. Defaults to 2 (responsive grid). Use 1 for list layout. */
  columns?: 1 | 2;
}

/**
 * Configuration UI for swipe direction bindings.
 * Allows setting file action and optional rating action for each swipe direction.
 */
export function SwipeBindingsConfig({
  className,
  showHeader = true,
  disabled = false,
  columns = 2,
}: SwipeBindingsConfigProps) {
  const bindings = useReviewSwipeBindings();
  const { setBinding, resetBindings } = useReviewSettingsActions();
  const { ratingServices } = useRatingServices();
  const { hasPermission, isFetched: permissionsFetched } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);

  const handleBindingChange = (
    direction: SwipeDirection,
    binding: ReviewSwipeBinding,
  ) => {
    setBinding(direction, binding);
  };

  const handleResetDirection = (direction: SwipeDirection) => {
    setBinding(direction, DEFAULT_SWIPE_BINDINGS[direction]);
  };

  const isDirectionModified = (direction: SwipeDirection) => {
    const current = bindings[direction];
    const defaultBinding = DEFAULT_SWIPE_BINDINGS[direction];
    return (
      current.fileAction !== defaultBinding.fileAction ||
      (current.secondaryActions?.length ?? 0) > 0
    );
  };

  const hasAnyModifications = SWIPE_DIRECTIONS.some(isDirectionModified);

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Swipe Actions</h3>
            <p className="text-muted-foreground text-sm">
              Configure what happens when you swipe in each direction.
            </p>
          </div>
          {hasAnyModifications && (
            <SettingsResetButton
              onReset={resetBindings}
              label="Reset all swipe actions"
            />
          )}
        </div>
      )}

      <div
        className={cn(
          "grid min-w-0 gap-3 sm:gap-4",
          columns === 2 && "lg:grid-cols-2",
        )}
      >
        {SWIPE_DIRECTIONS.map((direction) => (
          <DirectionBindingEditor
            key={direction}
            direction={direction}
            binding={bindings[direction]}
            ratingServices={ratingServices}
            canEditRatings={canEditRatings && permissionsFetched}
            isModified={isDirectionModified(direction)}
            onBindingChange={(binding) =>
              handleBindingChange(direction, binding)
            }
            onReset={() => handleResetDirection(direction)}
          />
        ))}
      </div>
    </div>
  );
}

// #endregion
