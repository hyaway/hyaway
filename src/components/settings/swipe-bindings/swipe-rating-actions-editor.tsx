// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import {
  IconEraser,
  IconMinus,
  IconPlus,
  IconSquareFilled,
  IconTrash,
} from "@tabler/icons-react";
import { SwipeActionWarning } from "./swipe-action-warning";
import type {
  LooseRatingSecondarySwipeAction,
  LooseRatingSwipeAction,
  ReviewSwipeBinding,
} from "@/stores/review-settings-store";
import type {
  LikeRatingServiceInfo,
  NumericalRatingServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  createSecondarySwipeActionId,
  getSecondarySwipeActionsByType,
  withUpsertedSecondarySwipeAction,
  withoutSecondarySwipeAction,
} from "@/stores/review-settings-store";
import {
  Permission,
  isIncDecRatingService,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useReadOnlyRatingServiceKeys } from "@/stores/ratings-settings-store";
import {
  LikeDislikeControl,
  NumericalRatingControl,
} from "@/components/ratings/rating-controls";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import {
  getDislikeColors,
  getIncDecPositiveColors,
  getLikeColors,
  getNumericalFilledColors,
} from "@/components/ratings/rating-colors";
import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import { cn } from "@/lib/utils";

interface RatingServiceIconProps {
  serviceKey: string;
  service: RatingServiceInfo;
  className?: string;
}

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
          <IconEraser className="size-6" stroke={2.5} />
        ) : (
          <IconEraser className="size-6" />
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
          <IconEraser className="size-6" stroke={2.5} />
        ) : (
          <IconEraser className="size-6" />
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
      onRatingActionChange(undefined);
    } else {
      onRatingActionChange({
        type: "incDecDelta",
        serviceKey,
        delta,
      });
    }
  };

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
              ) : ratingActionLabel === "Clear" ? (
                <>
                  Will clear <strong>{selectedService.name}</strong>
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

interface SwipeRatingActionsEditorProps {
  binding: ReviewSwipeBinding;
  onBindingChange: (binding: ReviewSwipeBinding) => void;
}

export function SwipeRatingActionsEditor({
  binding,
  onBindingChange,
}: SwipeRatingActionsEditorProps) {
  const { ratingServices } = useRatingServices();
  const readOnlyServiceKeys = useReadOnlyRatingServiceKeys();
  const { hasPermission, isFetched: permissionsFetched } = usePermissions();
  const canEditRatings =
    permissionsFetched && hasPermission(Permission.EDIT_FILE_RATINGS);
  const allRatingServiceKeys = useMemo(
    () => new Set(ratingServices.map(([key]) => key)),
    [ratingServices],
  );
  const ratingActions = getSecondarySwipeActionsByType(
    binding.secondaryActions,
    "rating",
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
  const hasRatingServices = ratingServices.length > 0;
  const availableRatingServices = ratingServices.filter(
    ([key]) => !readOnlyServiceKeys.has(key) && !usedRatingServiceKeys.has(key),
  );
  const canAddRating = canEditRatings && availableRatingServices.length > 0;

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

  return (
    <div className="flex min-w-0 flex-col gap-2">
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

      {!canEditRatings && ratingActions.length === 0 ? (
        <span className="text-muted-foreground/50 text-xs">
          No permission to edit ratings
        </span>
      ) : !hasRatingServices && ratingActions.length === 0 ? (
        <span className="text-muted-foreground/50 text-xs">
          No rating services available
        </span>
      ) : null}

      {ratingActions.length > 0 && (
        <div className="flex min-w-0 flex-col gap-2">
          {ratingActions.map((ratingAction) => {
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
                <SwipeActionWarning
                  key={actionId}
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
                <SwipeActionWarning
                  key={actionId}
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
      )}

      <Button
        variant="outline"
        size="sm"
        className="self-start"
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
  );
}
