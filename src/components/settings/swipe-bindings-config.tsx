// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconArchive,
  IconArrowBackUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconMinus,
  IconPlayerTrackNext,
  IconPlus,
  IconSquareFilled,
  IconTag,
  IconTrash,
  IconX,
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
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  DEFAULT_SWIPE_BINDINGS,
  SWIPE_DIRECTIONS,
  useReviewSettingsActions,
  useReviewSwipeBindings,
  useReviewTagServiceKey,
} from "@/stores/review-settings-store";
import {
  Permission,
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { resolveTagServiceKey } from "@/integrations/hydrus-api/tag-actions";
import { useReadOnlyRatingServiceKeys } from "@/stores/ratings-settings-store";
import { getTagActions, withTagActions } from "@/stores/review-binding-utils";
import {
  LikeDislikeControl,
  NumericalRatingControl,
} from "@/components/ratings/rating-controls";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
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
import { SettingsResetButton } from "@/components/settings/settings-ui";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
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
  { value: "undo", label: "Undo", icon: IconArrowBackUp },
];

/** Extract the first rating action from secondary actions */
function getRatingAction(
  secondaryActions?: Array<SecondarySwipeAction>,
): RatingSwipeAction | undefined {
  const ratingAction = secondaryActions?.find((a) => a.actionType === "rating");
  if (!ratingAction) return undefined;
  // Extract rating action fields (exclude actionType)
  const { actionType: _, ...rest } = ratingAction;
  return rest;
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

// #region Rating Service Icon Components

interface RatingServiceIconProps {
  serviceKey: string;
  service: RatingServiceInfo;
  className?: string;
}

/**
 * Renders the appropriate icon for a rating service based on its type.
 * Inc/Dec services show IconSquareFilled, others show their shape icon.
 */
function RatingServiceIcon({
  serviceKey,
  service,
  className,
}: RatingServiceIconProps) {
  const starShape = isIncDecRatingService(service)
    ? undefined
    : service.star_shape;
  const { filled: FilledIcon } = useShapeIcons(serviceKey, starShape);

  if (isIncDecRatingService(service)) {
    return <IconSquareFilled className={className} />;
  }

  return <FilledIcon className={className} />;
}

interface RatingServiceMenuItemProps {
  serviceKey: string;
  service: RatingServiceInfo;
  disabled?: boolean;
}

/**
 * Dropdown menu item for selecting a rating service, with icon.
 */
function RatingServiceMenuItem({
  serviceKey,
  service,
  disabled,
}: RatingServiceMenuItemProps) {
  return (
    <DropdownMenuRadioItem value={serviceKey} disabled={disabled}>
      <RatingServiceIcon
        serviceKey={serviceKey}
        service={service}
        className="text-muted-foreground size-4 shrink-0"
      />
      <span className="min-w-0 flex-1 truncate">{service.name}</span>
      {disabled && (
        <span className="text-muted-foreground ml-auto text-xs">Read-only</span>
      )}
    </DropdownMenuRadioItem>
  );
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

// #region Tag Service Selector

function TagServiceSelector({
  localTagServices,
  selectedKey,
  onSelect,
}: {
  localTagServices: Array<[string, ServiceInfo]>;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  if (localTagServices.length === 0) {
    return (
      <p className="text-muted-foreground/70 text-xs">
        No local tag service available to add tags to.
      </p>
    );
  }

  if (localTagServices.length === 1) {
    return (
      <p className="text-muted-foreground text-xs">
        Tags are added to <strong>{localTagServices[0][1].name}</strong>.
      </p>
    );
  }

  const selectedName =
    localTagServices.find(([key]) => key === selectedKey)?.[1].name ??
    "Select tag service...";

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label className="text-muted-foreground text-xs">Review tag service</Label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              variant="outline"
              size="sm"
              className="w-full min-w-0 justify-start sm:w-72"
            >
              <IconTag className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate">{selectedName}</span>
            </Button>
          )}
        />
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuRadioGroup
            value={selectedKey ?? ""}
            onValueChange={(value) => onSelect(value || null)}
          >
            {localTagServices.map(([key, service]) => (
              <DropdownMenuRadioItem key={key} value={key}>
                <span className="min-w-0 flex-1 truncate">{service.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// #endregion

// #region Tags To Add Editor

/** Per-kind copy + (muted) colour for the add/remove tag editors. */
const TAG_EDITOR_VARIANTS = {
  addTag: {
    label: "Tags to add (optional)",
    placeholder: "Add a tag...",
    ariaLabel: "Add a tag to this swipe",
    noPermission: "No permission to edit tags",
    chipClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    sign: "",
  },
  removeTag: {
    label: "Tags to remove (optional)",
    placeholder: "Remove a tag...",
    ariaLabel: "Remove a tag on this swipe",
    noPermission: "No permission to edit tags",
    chipClass: "bg-destructive/10 text-destructive",
    sign: "−",
  },
} as const;

function TagsEditor({
  binding,
  kind,
  canEditTags,
  tagServiceConfigured,
  onBindingChange,
}: {
  binding: ReviewSwipeBinding;
  kind: "addTag" | "removeTag";
  canEditTags: boolean;
  tagServiceConfigured: boolean;
  onBindingChange: (binding: ReviewSwipeBinding) => void;
}) {
  const variant = TAG_EDITOR_VARIANTS[kind];
  const tags = getTagActions(binding.secondaryActions, kind).map((a) => a.tag);
  const disabled = !canEditTags || !tagServiceConfigured;

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onBindingChange({
      ...binding,
      secondaryActions: withTagActions(
        binding.secondaryActions,
        [...tags, trimmed],
        kind,
      ),
    });
  };

  const handleRemoveTag = (tag: string) => {
    onBindingChange({
      ...binding,
      secondaryActions: withTagActions(
        binding.secondaryActions,
        tags.filter((t) => t !== tag),
        kind,
      ),
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label
        className={cn(
          "text-xs",
          disabled ? "text-muted-foreground/50" : "text-muted-foreground",
        )}
      >
        {variant.label}
      </Label>

      {disabled ? (
        <span className="text-muted-foreground/50 text-xs">
          {!canEditTags ? variant.noPermission : "Choose a review tag service first"}
        </span>
      ) : (
        <div className="flex min-w-0 flex-col gap-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                    variant.chipClass,
                  )}
                >
                  <span className="max-w-40 truncate">
                    {variant.sign}
                    {tag}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    className="opacity-70 hover:opacity-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <IconX className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <TagAutocompleteInput
            placeholder={variant.placeholder}
            ariaLabel={variant.ariaLabel}
            clearOnSelect
            onSelect={handleAddTag}
            onSubmit={handleAddTag}
          />
        </div>
      )}
    </div>
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
  allRatingServiceKeys: Set<string>;
  readOnlyServiceKeys: Set<string>;
  canEditRatings: boolean;
  canEditTags: boolean;
  tagServiceConfigured: boolean;
  isModified: boolean;
  onBindingChange: (binding: ReviewSwipeBinding) => void;
  onReset: () => void;
}

interface RatingActionWarningProps {
  variant?: "default" | "destructive";
  title: string;
  description: React.ReactNode;
  onClear: () => void;
}

function RatingActionWarning({
  variant = "default",
  title,
  description,
  onClear,
}: RatingActionWarningProps) {
  return (
    <div
      role="alert"
      className={cn(
        "bg-card text-card-foreground @container flex min-w-0 items-start gap-3 rounded-lg border px-5 py-4 text-left text-sm",
        variant === "destructive" && "text-destructive",
      )}
    >
      <IconAlertCircle className="mt-0.5 hidden size-6 shrink-0 @[14rem]:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="font-medium wrap-break-word">{title}</div>
        <div
          className={cn(
            "text-muted-foreground text-sm wrap-break-word",
            variant === "destructive" && "text-destructive/90",
          )}
        >
          {description}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 self-start"
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function DirectionBindingEditor({
  direction,
  binding,
  ratingServices,
  allRatingServiceKeys,
  readOnlyServiceKeys,
  canEditRatings,
  canEditTags,
  tagServiceConfigured,
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
  const selectedServiceName = selectedService?.name ?? selectedServiceKey;

  // Detect orphaned rating action (service no longer exists)
  const isOrphanedRating =
    ratingAction?.serviceKey != null &&
    !allRatingServiceKeys.has(ratingAction.serviceKey);
  const isReadOnlyRating =
    ratingAction?.serviceKey != null &&
    readOnlyServiceKeys.has(ratingAction.serviceKey);

  const handleFileActionChange = (value: Array<string>) => {
    const fileAction = value[0] as ReviewFileAction | undefined;
    // File action is required, ignore attempts to clear
    if (!fileAction) {
      return;
    }
    onBindingChange({
      ...binding,
      fileAction,
      // Undo doesn't support secondary actions — clear them
      ...(fileAction === "undo" ? { secondaryActions: undefined } : {}),
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

      {/* Rating Action — hidden when undo is selected (no secondary actions for undo) */}
      {binding.fileAction !== "undo" && (
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

          {isOrphanedRating ? (
            <RatingActionWarning
              variant="destructive"
              title="Rating service does not exist"
              description={
                <>
                  Rating service{" "}
                  <span className="break-all">{ratingAction.serviceKey}</span>{" "}
                  is no longer available. Clear it and pick a different rating service for this swipe
                  action.
                </>
              }
              onClear={() => handleRatingActionChange(undefined)}
            />
          ) : isReadOnlyRating ? (
            <RatingActionWarning
              title={`${selectedServiceName} is read-only`}
              description="Clear it, or turn off read-only for this rating service in settings."
              onClear={() => handleRatingActionChange(undefined)}
            />
          ) : !canConfigureRating ? (
            <span className="text-muted-foreground/50 text-xs">
              {!canEditRatings
                ? "No permission to edit ratings"
                : "No rating services available"}
            </span>
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
                      {selectedService && (
                        <RatingServiceIcon
                          serviceKey={selectedServiceKey}
                          service={selectedService}
                          className="text-muted-foreground size-4 shrink-0"
                        />
                      )}
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
                      <RatingServiceMenuItem
                        key={key}
                        serviceKey={key}
                        service={service}
                        disabled={readOnlyServiceKeys.has(key)}
                      />
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
      )}

      {/* Tags to add / remove — hidden for undo (no secondary actions) */}
      {binding.fileAction !== "undo" && (
        <>
          <TagsEditor
            binding={binding}
            kind="addTag"
            canEditTags={canEditTags}
            tagServiceConfigured={tagServiceConfigured}
            onBindingChange={onBindingChange}
          />
          <TagsEditor
            binding={binding}
            kind="removeTag"
            canEditTags={canEditTags}
            tagServiceConfigured={tagServiceConfigured}
            onBindingChange={onBindingChange}
          />
        </>
      )}
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
  const { setBinding, resetBindings, setTagServiceKey } =
    useReviewSettingsActions();
  const { ratingServices } = useRatingServices();
  const { hasPermission, isFetched: permissionsFetched } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);
  const canEditTags = hasPermission(Permission.EDIT_FILE_TAGS);
  const localTagServices = useLocalTagServices();
  const tagServiceKey = useReviewTagServiceKey();
  const resolvedTagServiceKey = useMemo(
    () => resolveTagServiceKey(localTagServices, tagServiceKey),
    [localTagServices, tagServiceKey],
  );

  useEffect(() => {
    if (
      canEditTags &&
      localTagServices.length === 1 &&
      tagServiceKey !== localTagServices[0][0]
    ) {
      setTagServiceKey(localTagServices[0][0]);
    }
  }, [canEditTags, localTagServices, tagServiceKey, setTagServiceKey]);

  const readOnlyServiceKeys = useReadOnlyRatingServiceKeys();
  const allRatingServiceKeys = useMemo(
    () => new Set(ratingServices.map(([key]) => key)),
    [ratingServices],
  );

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

      {canEditTags && permissionsFetched && (
        <TagServiceSelector
          localTagServices={localTagServices}
          selectedKey={resolvedTagServiceKey}
          onSelect={setTagServiceKey}
        />
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
            allRatingServiceKeys={allRatingServiceKeys}
            readOnlyServiceKeys={readOnlyServiceKeys}
            canEditRatings={canEditRatings && permissionsFetched}
            canEditTags={canEditTags && permissionsFetched}
            tagServiceConfigured={resolvedTagServiceKey != null}
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
