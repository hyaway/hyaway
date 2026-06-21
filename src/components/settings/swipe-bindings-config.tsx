// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import {
  IconAlertCircle,
  IconArchive,
  IconArrowBackUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCircleX,
  IconCircleXFilled,
  IconMinus,
  IconPlayerTrackNext,
  IconPlus,
  IconSquareFilled,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import type {
  LooseRatingSecondarySwipeAction,
  LooseRatingSwipeAction,
  LooseTagSwipeAction,
  ReviewFileAction,
  ReviewSwipeBinding,
  SwipeDirection,
  TagSwipeActionType,
} from "@/stores/review-settings-store";
import type {
  IncDecRatingServiceInfo,
  LikeRatingServiceInfo,
  LocalTagServiceInfo,
  NumericalRatingServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  DEFAULT_SWIPE_BINDINGS,
  SWIPE_DIRECTIONS,
  createSecondarySwipeActionId,
  getSecondarySwipeActionsByType,
  getTagSwipeActionIdentity,
  useReviewSettingsActions,
  useReviewSwipeBindings,
  withUpsertedSecondarySwipeAction,
  withoutSecondarySwipeAction,
} from "@/stores/review-settings-store";
import {
  Permission,
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useCleanTagsMutation } from "@/integrations/hydrus-api/queries/tags";
import { useReadOnlyRatingServiceKeys } from "@/stores/ratings-settings-store";
import {
  LikeDislikeControl,
  NumericalRatingControl,
} from "@/components/ratings/rating-controls";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import {
  getDislikeColors,
  getIncDecPositiveColors,
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
  const iconColors = isIncDecRatingService(service)
    ? getIncDecPositiveColors(service)
    : isNumericalRatingService(service)
      ? getNumericalFilledColors(service)
      : getLikeColors(service);
  const iconStyle = iconColors
    ? { color: iconColors.brush, stroke: iconColors.pen }
    : undefined;

  if (isIncDecRatingService(service)) {
    return (
      <IconSquareFilled
        className={className}
        style={iconStyle}
        strokeWidth={1.5}
      />
    );
  }

  return (
    <FilledIcon className={className} style={iconStyle} strokeWidth={1.5} />
  );
}

interface RatingServiceMenuItemProps {
  serviceKey: string;
  service: RatingServiceInfo;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Dropdown menu item for selecting a rating service, with icon.
 */
function RatingServiceMenuItem({
  serviceKey,
  service,
  disabled,
  disabledReason,
}: RatingServiceMenuItemProps) {
  return (
    <DropdownMenuRadioItem value={serviceKey} disabled={disabled}>
      <RatingServiceIcon
        serviceKey={serviceKey}
        service={service}
        className="text-muted-foreground size-4 shrink-0"
      />
      <span className="min-w-0 flex-1 truncate">{service.name}</span>
      {disabledReason && (
        <span className="text-muted-foreground ml-auto text-xs">
          {disabledReason}
        </span>
      )}
    </DropdownMenuRadioItem>
  );
}

// #endregion

// #region Rating Value Picker

interface RatingValuePickerProps {
  serviceKey: string;
  service: RatingServiceInfo;
  ratingAction: LooseRatingSwipeAction | undefined;
  onRatingActionChange: (action: LooseRatingSwipeAction | undefined) => void;
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
  ratingAction: LooseRatingSwipeAction | undefined;
  onRatingActionChange: (action: LooseRatingSwipeAction | undefined) => void;
}) {
  const isConfigured =
    ratingAction?.type === "setLike" && ratingAction.serviceKey === serviceKey;
  const currentValue = isConfigured ? ratingAction.value : undefined;
  const isClearConfigured = isConfigured && currentValue === null;

  const handleChange = (value: boolean | null) => {
    if (value === null) {
      onRatingActionChange(undefined);
      return;
    }

    onRatingActionChange({
      type: "setLike",
      serviceKey,
      value,
    });
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <LikeDislikeControl
        value={currentValue ?? null}
        serviceKey={serviceKey}
        starShape={service.star_shape}
        onChange={handleChange}
        size="compact"
        likeColors={getLikeColors(service)}
        dislikeColors={getDislikeColors(service)}
      />
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0"
        aria-label={
          isClearConfigured ? "Clear rating action selected" : "Clear rating"
        }
        aria-pressed={isClearConfigured}
        onClick={() => {
          if (isClearConfigured) {
            onRatingActionChange(undefined);
            return;
          }

          onRatingActionChange({
            type: "setLike",
            serviceKey,
            value: null,
          });
        }}
      >
        {isClearConfigured ? (
          <IconCircleXFilled className="size-7" />
        ) : (
          <IconCircleX className="size-7" />
        )}
      </Button>
    </div>
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
  ratingAction: LooseRatingSwipeAction | undefined;
  onRatingActionChange: (action: LooseRatingSwipeAction | undefined) => void;
}) {
  const isConfigured =
    ratingAction?.type === "setNumerical" &&
    ratingAction.serviceKey === serviceKey;
  const currentValue = isConfigured ? ratingAction.value : undefined;
  const isClearConfigured = isConfigured && currentValue === null;

  const handleChange = (value: number | null) => {
    if (value === null) {
      onRatingActionChange(undefined);
      return;
    }

    onRatingActionChange({
      type: "setNumerical",
      serviceKey,
      value,
    });
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
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
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0"
        aria-label={
          isClearConfigured ? "Clear rating action selected" : "Clear rating"
        }
        aria-pressed={isClearConfigured}
        onClick={() => {
          if (isClearConfigured) {
            onRatingActionChange(undefined);
            return;
          }

          onRatingActionChange({
            type: "setNumerical",
            serviceKey,
            value: null,
          });
        }}
      >
        {isClearConfigured ? (
          <IconCircleXFilled className="size-7" />
        ) : (
          <IconCircleX className="size-7" />
        )}
      </Button>
    </div>
  );
}

function IncDecRatingValuePicker({
  serviceKey,
  ratingAction,
  onRatingActionChange,
}: {
  serviceKey: string;
  service: IncDecRatingServiceInfo;
  ratingAction: LooseRatingSwipeAction | undefined;
  onRatingActionChange: (action: LooseRatingSwipeAction | undefined) => void;
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

/** Get a human-readable description of a rating action */
function getRatingActionLabel(
  action: LooseRatingSwipeAction,
): string | undefined {
  switch (action.type) {
    case undefined:
      return undefined;
    case "setLike":
      if (action.value === undefined) return undefined;
      if (action.value === true) return "Like";
      if (action.value === false) return "Dislike";
      return "Clear";
    case "setNumerical":
      if (action.value === undefined) return undefined;
      if (action.value === null) return "Clear";
      return `${action.value} star${action.value !== 1 ? "s" : ""}`;
    case "incDecDelta":
      if (action.delta == null) return undefined;
      return action.delta === 1 ? "Increment" : "Decrement";
  }
}

interface DirectionBindingEditorProps {
  direction: SwipeDirection;
  binding: ReviewSwipeBinding;
  ratingServices: Array<[string, RatingServiceInfo]>;
  localTagServices: Array<[string, LocalTagServiceInfo]>;
  allRatingServiceKeys: Set<string>;
  allLocalTagServiceKeys: Set<string>;
  readOnlyServiceKeys: Set<string>;
  canEditRatings: boolean;
  canEditTags: boolean;
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

interface RatingActionEditorProps {
  selectedServiceKey: string;
  ratingAction: LooseRatingSwipeAction | undefined;
  ratingServices: Array<[string, RatingServiceInfo]>;
  readOnlyServiceKeys: Set<string>;
  usedServiceKeys: Set<string>;
  disabled?: boolean;
  validationMessage?: string;
  onServiceChange: (serviceKey: string) => void;
  onRatingActionChange: (action: LooseRatingSwipeAction | undefined) => void;
  onRemove: () => void;
}

function getEmptyRatingAction(
  serviceKey: string,
  ratingServices: Array<[string, RatingServiceInfo]>,
): LooseRatingSwipeAction {
  const service = ratingServices.find(([key]) => key === serviceKey)?.[1];
  const keyProps = serviceKey ? { serviceKey } : {};

  if (service && isNumericalRatingService(service)) {
    return { type: "setNumerical", ...keyProps };
  }

  if (service && isIncDecRatingService(service)) {
    return { type: "incDecDelta", ...keyProps };
  }

  if (service && isLikeRatingService(service)) {
    return { type: "setLike", ...keyProps };
  }

  return keyProps;
}

function RatingActionEditor({
  selectedServiceKey,
  ratingAction,
  ratingServices,
  readOnlyServiceKeys,
  usedServiceKeys,
  disabled,
  validationMessage,
  onServiceChange,
  onRatingActionChange,
  onRemove,
}: RatingActionEditorProps) {
  const selectedService = ratingServices.find(
    ([key]) => key === selectedServiceKey,
  )?.[1];
  const valueLabel =
    selectedService && isIncDecRatingService(selectedService)
      ? "Change by:"
      : "Set to:";
  const ratingActionLabel = ratingAction
    ? getRatingActionLabel(ratingAction)
    : undefined;

  return (
    <div className="bg-muted/20 flex min-w-0 flex-col gap-2 rounded-md border p-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  className="w-full min-w-0 justify-start"
                  disabled={disabled}
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
            <DropdownMenuContent
              align="start"
              className="w-max min-w-(--anchor-width)"
            >
              <DropdownMenuRadioGroup
                value={selectedServiceKey}
                onValueChange={onServiceChange}
              >
                <DropdownMenuRadioItem value="">None</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {ratingServices.map(([key, service]) => {
                  const isUsedElsewhere =
                    key !== selectedServiceKey && usedServiceKeys.has(key);
                  const isReadOnly = readOnlyServiceKeys.has(key);
                  const disabledReason = isReadOnly
                    ? "Read-only"
                    : isUsedElsewhere
                      ? "Already selected"
                      : undefined;
                  return (
                    <RatingServiceMenuItem
                      key={key}
                      serviceKey={key}
                      service={service}
                      disabled={isReadOnly || isUsedElsewhere}
                      disabledReason={disabledReason}
                    />
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Remove rating action"
          onClick={onRemove}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>

      {selectedService && (
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-muted-foreground shrink-0 text-xs">
              {valueLabel}
            </span>
            <RatingValuePicker
              serviceKey={selectedServiceKey}
              service={selectedService}
              ratingAction={ratingAction}
              onRatingActionChange={onRatingActionChange}
            />
          </div>
          {ratingAction?.type && ratingActionLabel && (
            <span className="text-muted-foreground text-xs">
              {ratingAction.type === "incDecDelta" ? (
                <>
                  Will <strong>{ratingActionLabel.toLowerCase()}</strong>{" "}
                  {selectedService.name}
                </>
              ) : (
                <>
                  Will set {selectedService.name} to:{" "}
                  <strong>{ratingActionLabel}</strong>
                </>
              )}
            </span>
          )}
        </div>
      )}

      {validationMessage && (
        <span className="text-destructive text-xs">{validationMessage}</span>
      )}
    </div>
  );
}

type TagActionDraft = LooseTagSwipeAction & {
  validationMessage?: string;
};

function toCommitableTagAction(
  draft: TagActionDraft,
): LooseTagSwipeAction | undefined {
  const tag = draft.tag?.trim();
  if (!draft.type || !draft.serviceKey || !tag) return undefined;

  return {
    type: draft.type,
    serviceKey: draft.serviceKey,
    tag,
  };
}

interface TagActionEditorProps {
  draft: TagActionDraft;
  localTagServices: Array<[string, LocalTagServiceInfo]>;
  disabled?: boolean;
  cleanTagsMutation: ReturnType<typeof useCleanTagsMutation>;
  validateDraft: (draft: TagActionDraft) => string | undefined;
  onDraftChange: (draft: TagActionDraft) => void;
  onCommit: (
    draft: TagActionDraft,
  ) => string | undefined | Promise<string | undefined>;
  onRemove: () => void;
}

function TagActionEditor({
  draft,
  localTagServices,
  disabled,
  cleanTagsMutation,
  validateDraft,
  onDraftChange,
  onCommit,
  onRemove,
}: TagActionEditorProps) {
  const selectedTagService = localTagServices.find(
    ([key]) => key === draft.serviceKey,
  )?.[1];
  const selectedTagServiceName = selectedTagService?.name ?? draft.serviceKey;

  const updateDraft = (nextDraft: TagActionDraft) => {
    onDraftChange({
      ...nextDraft,
      validationMessage: validateDraft(nextDraft),
    });
  };

  const handleCommit = async (rawTag: string) => {
    const trimmed = rawTag.trim();
    updateDraft({ ...draft, tag: trimmed });

    if (!trimmed) {
      onDraftChange({
        ...draft,
        tag: trimmed,
        validationMessage: "Enter a tag.",
      });
      return;
    }

    const localValidationMessage = validateDraft({ ...draft, tag: trimmed });
    if (localValidationMessage) {
      onDraftChange({
        ...draft,
        tag: trimmed,
        validationMessage: localValidationMessage,
      });
      return;
    }

    const result = await cleanTagsMutation.mutateAsync([trimmed]);
    const cleanedTag = result.tags[0]?.trim();
    if (!cleanedTag) {
      onDraftChange({
        ...draft,
        tag: trimmed,
        validationMessage: "Enter a valid tag.",
      });
      return;
    }

    const validationMessage = await onCommit({ ...draft, tag: cleanedTag });
    if (validationMessage) {
      onDraftChange({ ...draft, tag: cleanedTag, validationMessage });
    }
  };

  return (
    <div className="bg-muted/20 flex min-w-0 flex-col gap-2 rounded-md border p-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ToggleGroup
          value={draft.type ? [draft.type] : []}
          onValueChange={(values) => {
            const type = values[0] as TagSwipeActionType | undefined;
            if (type) updateDraft({ ...draft, type });
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="add" aria-label="Add tag" disabled={disabled}>
            <IconPlus className="size-4" />
            <span>Add</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="remove"
            aria-label="Remove tag"
            disabled={disabled}
          >
            <IconMinus className="size-4" />
            <span>Remove</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="min-w-0 flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  variant="outline"
                  size="sm"
                  className="w-full min-w-0 justify-start"
                  disabled={disabled}
                >
                  <IconTag className="text-muted-foreground size-4 shrink-0" />
                  <span className="truncate">
                    {selectedTagService?.name ?? "Select tag domain..."}
                  </span>
                </Button>
              )}
            />
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuRadioGroup
                value={draft.serviceKey ?? ""}
                onValueChange={(serviceKey) =>
                  updateDraft({
                    ...draft,
                    ...(serviceKey
                      ? { serviceKey }
                      : { serviceKey: undefined }),
                  })
                }
              >
                <DropdownMenuRadioItem value="">None</DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                {localTagServices.map(([key, service]) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    <IconTag className="text-muted-foreground size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {service.name}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label="Remove tag action"
          onClick={onRemove}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>

      {draft.serviceKey && (
        <TagAutocompleteInput
          value={draft.tag ?? ""}
          onChange={(value) => updateDraft({ ...draft, tag: value })}
          onSelect={handleCommit}
          onSubmit={handleCommit}
          onBlur={handleCommit}
          placeholder="Enter tag"
          ariaLabel="Tag action tag"
          disabled={disabled || cleanTagsMutation.isPending}
          systemTagSuggestions={[]}
          showFavouriteSuggestions={false}
          submitEmptyOnBlur
          submitEmptyOnEnter
          searchOptions={{
            tag_display_type: "storage",
          }}
        />
      )}

      {draft.validationMessage && (
        <span className="text-destructive text-xs">
          {draft.validationMessage}
        </span>
      )}

      {draft.type &&
        draft.serviceKey &&
        draft.tag &&
        !draft.validationMessage && (
          <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            <span className="shrink-0">
              Will {draft.type === "add" ? "add" : "remove"}
            </span>
            <TagBadgeFromString displayTag={draft.tag} size="xs" />
            {draft.serviceKey && (
              <span className="min-w-0 wrap-break-word">
                {draft.type === "add" ? "to" : "from"} {selectedTagServiceName}
              </span>
            )}
          </div>
        )}
    </div>
  );
}

function DirectionBindingEditor({
  direction,
  binding,
  ratingServices,
  localTagServices,
  allRatingServiceKeys,
  allLocalTagServiceKeys,
  readOnlyServiceKeys,
  canEditRatings,
  canEditTags,
  isModified,
  onBindingChange,
  onReset,
}: DirectionBindingEditorProps) {
  const config = DIRECTION_CONFIG[direction];
  const DirectionIcon = config.icon;
  const cleanTagsMutation = useCleanTagsMutation();
  const ratingActions = getSecondarySwipeActionsByType(
    binding.secondaryActions,
    "rating",
  );
  const tagActions = getSecondarySwipeActionsByType(
    binding.secondaryActions,
    "tag",
  );

  const usedRatingServiceKeys = useMemo(
    () =>
      new Set(
        ratingActions
          .map((action) => action.serviceKey)
          .filter((serviceKey): serviceKey is string => Boolean(serviceKey)),
      ),
    [ratingActions],
  );
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

  const removeRatingAction = (actionId: string) => {
    onBindingChange({
      ...binding,
      secondaryActions: withoutSecondarySwipeAction(
        binding.secondaryActions,
        "rating",
        actionId,
      ),
    });
  };

  const upsertRatingAction = (
    ratingAction: LooseRatingSwipeAction,
    actionId: string,
  ) => {
    onBindingChange({
      ...binding,
      secondaryActions: withUpsertedSecondarySwipeAction(
        binding.secondaryActions,
        {
          id: actionId,
          actionType: "rating",
          ...ratingAction,
        },
      ),
    });
  };

  const getRatingActionValidationMessage = (
    ratingAction: LooseRatingSecondarySwipeAction,
    actionId: string,
  ) => {
    if (!ratingAction.serviceKey) return undefined;

    const isDuplicate = ratingActions.some(
      (action) =>
        action.id !== actionId && action.serviceKey === ratingAction.serviceKey,
    );
    if (isDuplicate) {
      return "This rating service already has an action for this swipe.";
    }

    return undefined;
  };

  const removeTagAction = (actionId: string) => {
    onBindingChange({
      ...binding,
      secondaryActions: withoutSecondarySwipeAction(
        binding.secondaryActions,
        "tag",
        actionId,
      ),
    });
  };

  const upsertTagAction = (
    tagAction: LooseTagSwipeAction,
    actionId: string,
  ) => {
    onBindingChange({
      ...binding,
      secondaryActions: withUpsertedSecondarySwipeAction(
        binding.secondaryActions,
        {
          id: actionId,
          actionType: "tag",
          ...tagAction,
        },
      ),
    });
  };

  const getTagDraftDuplicateMessage = (
    draft: TagActionDraft,
    actionId: string,
  ) => {
    if (!draft.type || !draft.serviceKey) return undefined;
    const tag = draft.tag?.trim() ?? "";
    if (!tag) return undefined;

    const nextIdentity = getTagSwipeActionIdentity({
      serviceKey: draft.serviceKey,
      tag,
    });
    const isDuplicate = tagActions.some(
      (action) =>
        action.id !== actionId &&
        getTagSwipeActionIdentity(action) === nextIdentity,
    );
    if (isDuplicate) {
      return "This local tag domain already has an action for this tag.";
    }

    return undefined;
  };

  const validateTagDraftForCommit = (
    draft: TagActionDraft,
    actionId: string,
  ) => {
    if (!draft.type) return "Choose add or remove first.";

    const tag = draft.tag?.trim() ?? "";
    if (!tag) return "Enter a tag.";

    if (!draft.serviceKey) {
      return "Choose a local tag domain first.";
    }

    return getTagDraftDuplicateMessage(draft, actionId);
  };

  const commitTagDraft = (draft: TagActionDraft, actionId: string) => {
    const validationMessage = validateTagDraftForCommit(draft, actionId);
    if (validationMessage) {
      return validationMessage;
    }

    const nextAction = toCommitableTagAction(draft);
    if (!nextAction) return "Enter a tag.";

    upsertTagAction(nextAction, actionId);
    return undefined;
  };

  const hasRatingServices = ratingServices.length > 0;
  const availableRatingServices = ratingServices.filter(
    ([key]) => !readOnlyServiceKeys.has(key) && !usedRatingServiceKeys.has(key),
  );
  const hasLocalTagServices = localTagServices.length > 0;
  const canAddRating = canEditRatings && availableRatingServices.length > 0;
  const canAddTag = canEditTags && hasLocalTagServices;

  return (
    <div className="@container flex min-w-0 flex-col gap-3 rounded-lg border p-3 sm:p-4">
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

      {/* Rating Actions — hidden when undo is selected (no secondary actions for undo) */}
      {binding.fileAction !== "undo" && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <Label
              className={cn(
                "text-xs",
                canEditRatings && hasRatingServices
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50",
              )}
            >
              Rating actions (optional)
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const actionId = createSecondarySwipeActionId("rating");
                upsertRatingAction(
                  getEmptyRatingAction("", ratingServices),
                  actionId,
                );
              }}
              disabled={!canAddRating}
            >
              <IconPlus className="size-4" />
              Add rating
            </Button>
          </div>

          {!canEditRatings && ratingActions.length === 0 ? (
            <span className="text-muted-foreground/50 text-xs">
              No permission to edit ratings
            </span>
          ) : !hasRatingServices && ratingActions.length === 0 ? (
            <span className="text-muted-foreground/50 text-xs">
              No rating services available
            </span>
          ) : null}

          <div className="flex min-w-0 flex-col gap-2">
            {ratingActions.map((ratingAction, index) => {
              const actionId = ratingAction.id;
              const service = ratingServices.find(
                ([key]) => key === ratingAction.serviceKey,
              )?.[1];
              const serviceName =
                service?.name ?? ratingAction.serviceKey ?? "Rating service";
              const isOrphanedRating =
                ratingAction.serviceKey &&
                !allRatingServiceKeys.has(ratingAction.serviceKey);
              const isReadOnlyRating = readOnlyServiceKeys.has(
                ratingAction.serviceKey ?? "",
              );

              if (isOrphanedRating) {
                return (
                  <RatingActionWarning
                    key={`${ratingAction.serviceKey}-${index}`}
                    variant="destructive"
                    title="Rating service does not exist"
                    description={
                      <>
                        Rating service{" "}
                        <span className="break-all">
                          {ratingAction.serviceKey}
                        </span>{" "}
                        is no longer available. Clear it and pick a different
                        rating service for this swipe action.
                      </>
                    }
                    onClear={() => removeRatingAction(actionId)}
                  />
                );
              }

              if (isReadOnlyRating) {
                return (
                  <RatingActionWarning
                    key={`${ratingAction.serviceKey}-${index}`}
                    title={`${serviceName} is read-only`}
                    description="Clear it, or turn off read-only for this rating service in settings."
                    onClear={() => removeRatingAction(actionId)}
                  />
                );
              }

              return (
                <RatingActionEditor
                  key={actionId}
                  selectedServiceKey={ratingAction.serviceKey ?? ""}
                  ratingAction={ratingAction}
                  ratingServices={ratingServices}
                  readOnlyServiceKeys={readOnlyServiceKeys}
                  usedServiceKeys={usedRatingServiceKeys}
                  disabled={!canEditRatings}
                  validationMessage={getRatingActionValidationMessage(
                    ratingAction,
                    actionId,
                  )}
                  onServiceChange={(serviceKey) => {
                    upsertRatingAction(
                      getEmptyRatingAction(serviceKey, ratingServices),
                      actionId,
                    );
                  }}
                  onRatingActionChange={(newRatingAction) => {
                    upsertRatingAction(
                      newRatingAction ??
                        getEmptyRatingAction(
                          ratingAction.serviceKey ?? "",
                          ratingServices,
                        ),
                      actionId,
                    );
                  }}
                  onRemove={() => removeRatingAction(actionId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tag Actions — hidden when undo is selected (no secondary actions for undo) */}
      {binding.fileAction !== "undo" && (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <Label
              className={cn(
                "text-xs",
                canEditTags && hasLocalTagServices
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50",
              )}
            >
              Tag actions (optional)
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const actionId = createSecondarySwipeActionId("tag");
                upsertTagAction({}, actionId);
              }}
              disabled={!canAddTag}
            >
              <IconPlus className="size-4" />
              Add tag
            </Button>
          </div>

          {!canEditTags && tagActions.length === 0 ? (
            <span className="text-muted-foreground/50 text-xs">
              No permission to edit file tags
            </span>
          ) : !hasLocalTagServices && tagActions.length === 0 ? (
            <span className="text-muted-foreground/50 text-xs">
              No local tag domains available
            </span>
          ) : null}

          <div className="flex min-w-0 flex-col gap-2">
            {tagActions.map((tagAction, index) => {
              const identity = getTagSwipeActionIdentity(tagAction);
              const actionId = tagAction.id;
              const isOrphanedTag =
                tagAction.serviceKey &&
                !allLocalTagServiceKeys.has(tagAction.serviceKey);

              if (isOrphanedTag) {
                return (
                  <RatingActionWarning
                    key={`${identity}-${index}`}
                    variant="destructive"
                    title="Tag service does not exist"
                    description={
                      <>
                        Tag service{" "}
                        <span className="break-all">
                          {tagAction.serviceKey}
                        </span>{" "}
                        is no longer available. Clear it and pick a different
                        local tag domain for this swipe action.
                      </>
                    }
                    onClear={() => removeTagAction(actionId)}
                  />
                );
              }

              return (
                <TagActionEditor
                  key={actionId}
                  draft={{
                    ...tagAction,
                    validationMessage: getTagDraftDuplicateMessage(
                      tagAction,
                      actionId,
                    ),
                  }}
                  localTagServices={localTagServices}
                  disabled={!canEditTags}
                  cleanTagsMutation={cleanTagsMutation}
                  validateDraft={(draft) =>
                    getTagDraftDuplicateMessage(draft, actionId)
                  }
                  onDraftChange={(draft) => {
                    upsertTagAction(
                      {
                        type: draft.type,
                        serviceKey: draft.serviceKey,
                        tag: draft.tag,
                      },
                      actionId,
                    );
                  }}
                  onCommit={(draft) => commitTagDraft(draft, actionId)}
                  onRemove={() => removeTagAction(actionId)}
                />
              );
            })}
          </div>
        </div>
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
  const { setBinding, resetBindings } = useReviewSettingsActions();
  const { ratingServices } = useRatingServices();
  const { localTagServices } = useLocalTagServices();
  const { hasPermission, isFetched: permissionsFetched } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);
  const canEditTags = hasPermission(Permission.EDIT_FILE_TAGS);

  const readOnlyServiceKeys = useReadOnlyRatingServiceKeys();
  const allRatingServiceKeys = useMemo(
    () => new Set(ratingServices.map(([key]) => key)),
    [ratingServices],
  );
  const allLocalTagServiceKeys = useMemo(
    () => new Set(localTagServices.map(([key]) => key)),
    [localTagServices],
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
            localTagServices={localTagServices}
            allRatingServiceKeys={allRatingServiceKeys}
            allLocalTagServiceKeys={allLocalTagServiceKeys}
            readOnlyServiceKeys={readOnlyServiceKeys}
            canEditRatings={canEditRatings && permissionsFetched}
            canEditTags={canEditTags && permissionsFetched}
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
