// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import { IconHeart } from "@tabler/icons-react";
import type {
  FileMetadata,
  RatingValue,
  ServiceInfo,
} from "@/integrations/hydrus-api/models";
import { Permission, ServiceType } from "@/integrations/hydrus-api/models";
import { useSetRatingMutation } from "@/integrations/hydrus-api/queries/ratings";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useReviewRatingsExcludedServices } from "@/stores/review-ratings-settings-store";
import { useReviewQueueCurrentFileId } from "@/stores/review-queue-store";
import { useGetSingleFileMetadata } from "@/integrations/hydrus-api/queries/manage-files";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import { CrossedOutIcon } from "@/components/ratings/crossed-out-icon";
import {
  IncDecRatingControl,
  LikeDislikeControl,
  NumericalRatingControl,
} from "@/components/ratings/rating-controls";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";

/**
 * Hook to get enabled rating services for review mode.
 * Returns services that are not excluded + relevant metadata.
 */
export function useEnabledReviewRatingServices() {
  const { ratingServices, isLoading } = useRatingServices();
  const excludedServices = useReviewRatingsExcludedServices();
  const { hasPermission, isFetched: permissionsFetched } = usePermissions();
  const canEditRatings = hasPermission(Permission.EDIT_FILE_RATINGS);

  const enabledServices = useMemo(
    () => ratingServices.filter(([key]) => !excludedServices.has(key)),
    [ratingServices, excludedServices],
  );

  return {
    enabledServices,
    isLoading: isLoading || !permissionsFetched,
    canEditRatings,
    hasEnabledServices: enabledServices.length > 0,
    isSingleService: enabledServices.length === 1,
  };
}

interface ReviewRatingButtonProps {
  /** Additional class name */
  className?: string;
  /** Truncate label at max characters */
  truncateLabel?: boolean;
}

/**
 * Rating button for review footer.
 * - Hidden when no permission or no services enabled
 * - Single service: click does primary action (except numeric > 5), context menu for secondary
 * - Multiple services: click opens popover with all controls
 */
export function ReviewRatingButton({
  className,
  truncateLabel,
}: ReviewRatingButtonProps) {
  const {
    enabledServices,
    isLoading,
    canEditRatings,
    hasEnabledServices,
    isSingleService,
  } = useEnabledReviewRatingServices();

  const placeholderLabel =
    enabledServices.length === 1
      ? (enabledServices[0]?.[1].name ?? "Rate")
      : "Rate";

  const currentFileId = useReviewQueueCurrentFileId();
  const { data: currentMetadata } = useGetSingleFileMetadata(
    currentFileId ?? 0,
  );

  // Keep footer layout stable even when ratings are unavailable/disabled.
  if (isLoading || !canEditRatings || !hasEnabledServices || !currentFileId) {
    return (
      <BottomNavButton
        label={placeholderLabel}
        icon={<IconHeart className="size-6" />}
        disabled
        className={cn("pointer-events-none invisible", className)}
        truncateLabel={truncateLabel}
      />
    );
  }

  // Single service mode: special behavior based on service type
  if (isSingleService && enabledServices[0]) {
    const [serviceKey, service] = enabledServices[0];
    const currentRating = currentMetadata?.ratings?.[serviceKey] ?? null;

    // Otherwise use single-service optimized button
    return (
      <SingleServiceRatingButton
        serviceKey={serviceKey}
        service={service}
        fileId={currentFileId}
        currentRating={currentRating}
        className={className}
        truncateLabel={truncateLabel}
      />
    );
  }

  // Multi-service mode: show popover
  return (
    <MultiServiceRatingButton
      services={enabledServices}
      metadata={currentMetadata}
      className={className}
      truncateLabel={truncateLabel}
    />
  );
}

// ============================================================================
// Single Service Mode
// ============================================================================

interface SingleServiceRatingButtonProps {
  serviceKey: string;
  service: ServiceInfo;
  fileId: number;
  currentRating: RatingValue;
  className?: string;
  truncateLabel?: boolean;
}

function SingleServiceRatingButton({
  serviceKey,
  service,
  fileId,
  currentRating,
  className,
  truncateLabel,
}: SingleServiceRatingButtonProps) {
  if (service.type === ServiceType.RATING_LIKE) {
    return (
      <LikeDislikeRatingButton
        serviceKey={serviceKey}
        service={service}
        fileId={fileId}
        currentRating={currentRating as boolean | null}
        className={className}
        truncateLabel={truncateLabel}
      />
    );
  }

  if (service.type === ServiceType.RATING_INC_DEC) {
    return (
      <IncDecRatingButton
        serviceKey={serviceKey}
        service={service}
        fileId={fileId}
        currentRating={(currentRating as number | null) ?? 0}
        className={className}
        truncateLabel={truncateLabel}
      />
    );
  }

  // Numeric
  return (
    <NumericRatingButton
      serviceKey={serviceKey}
      service={service}
      fileId={fileId}
      currentRating={currentRating as number | null}
      className={className}
      truncateLabel={truncateLabel}
    />
  );
}

// ----------------------------------------------------------------------------
// Like/Dislike: click = toggle like, right-click = toggle dislike
// ----------------------------------------------------------------------------

interface LikeDislikeRatingButtonProps {
  serviceKey: string;
  service: ServiceInfo;
  fileId: number;
  currentRating: boolean | null;
  className?: string;
  truncateLabel?: boolean;
}

function LikeDislikeRatingButton({
  serviceKey,
  service,
  fileId,
  currentRating,
  className,
  truncateLabel,
}: LikeDislikeRatingButtonProps) {
  const { mutate: setRating, isPending } = useSetRatingMutation();
  const { filled: FilledIcon, outline: OutlineIcon } = useShapeIcons(
    serviceKey,
    service.star_shape,
  );

  const isLiked = currentRating === true;
  const isDisliked = currentRating === false;

  const icon = isLiked ? (
    <FilledIcon className="size-6 text-emerald-500" />
  ) : isDisliked ? (
    <CrossedOutIcon className="text-destructive size-6">
      <FilledIcon className="size-6" />
    </CrossedOutIcon>
  ) : (
    <OutlineIcon className="size-6" />
  );

  const handlePrimaryAction = () => {
    // If any rating exists, clear it. Otherwise set to like.
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating: currentRating !== null ? null : true,
    });
  };

  const handleSecondaryAction = (e: React.MouseEvent) => {
    e.preventDefault();
    // Toggle dislike: null -> false, false -> null, true -> false
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating: currentRating === false ? null : false,
    });
  };

  return (
    <BottomNavButton
      label={service.name}
      icon={icon}
      onClick={handlePrimaryAction}
      onContextMenu={handleSecondaryAction}
      disabled={isPending}
      className={className}
      truncateLabel={truncateLabel}
    />
  );
}

// ----------------------------------------------------------------------------
// Inc/Dec: click = increment, right-click = decrement
// ----------------------------------------------------------------------------

interface IncDecRatingButtonProps {
  serviceKey: string;
  service: ServiceInfo;
  fileId: number;
  currentRating: number;
  className?: string;
  truncateLabel?: boolean;
}

function IncDecRatingButton({
  serviceKey,
  service,
  fileId,
  currentRating,
  className,
  truncateLabel,
}: IncDecRatingButtonProps) {
  const { mutate: setRating, isPending } = useSetRatingMutation();
  const sign = currentRating > 0 ? "+" : "";

  const handlePrimaryAction = () => {
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating: currentRating + 1,
    });
  };

  const handleSecondaryAction = (e: React.MouseEvent) => {
    e.preventDefault();
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating: Math.max(0, currentRating - 1),
    });
  };

  return (
    <BottomNavButton
      label={service.name}
      customContent={
        <span className="short:text-base text-lg font-semibold tabular-nums">
          {sign}
          {currentRating}
        </span>
      }
      onClick={handlePrimaryAction}
      onContextMenu={handleSecondaryAction}
      disabled={isPending}
      className={className}
      truncateLabel={truncateLabel}
    />
  );
}

// ----------------------------------------------------------------------------
// Numeric: opens popover with star options
// ----------------------------------------------------------------------------

interface NumericRatingButtonProps {
  serviceKey: string;
  service: ServiceInfo;
  fileId: number;
  currentRating: number | null;
  className?: string;
  truncateLabel?: boolean;
}

function NumericRatingButton({
  serviceKey,
  service,
  fileId,
  currentRating,
  className,
  truncateLabel,
}: NumericRatingButtonProps) {
  const { mutate: setRating, isPending } = useSetRatingMutation();
  const { filled: FilledIcon, outline: OutlineIcon } = useShapeIcons(
    serviceKey,
    service.star_shape,
  );

  const maxStars = service.max_stars ?? 5;

  // Show star count when rated, otherwise show outline icon
  const content =
    currentRating !== null ? (
      <span className="flex items-center gap-0.5">
        <FilledIcon className="size-4 text-amber-500" />
        <span className="text-base font-semibold tabular-nums">
          {currentRating}
        </span>
      </span>
    ) : (
      <OutlineIcon className="size-6" />
    );

  const handleSetRating = (rating: RatingValue) => {
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating,
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <BottomNavButton
            label={service.name}
            customContent={content}
            disabled={isPending}
            className={className}
            truncateLabel={truncateLabel}
          />
        }
      />
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-auto"
      >
        <NumericalRatingControl
          value={currentRating}
          minStars={service.min_stars ?? 0}
          maxStars={maxStars}
          serviceKey={serviceKey}
          starShape={service.star_shape}
          onChange={handleSetRating}
          disabled={isPending}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Multi Service Mode (Popover)
// ============================================================================

interface MultiServiceRatingButtonProps {
  services: Array<[string, ServiceInfo]>;
  metadata?: FileMetadata;
  className?: string;
  truncateLabel?: boolean;
}

function MultiServiceRatingButton({
  services,
  metadata,
  className,
  truncateLabel,
}: MultiServiceRatingButtonProps) {
  const [open, setOpen] = useState(false);

  // Get first service icon for button display (only used for single service)
  const firstEntry = services[0] as [string, ServiceInfo] | undefined;
  const firstServiceKey = firstEntry ? firstEntry[0] : "";
  const firstService = firstEntry ? firstEntry[1] : undefined;
  const { filled: FirstFilledIcon, outline: FirstOutlineIcon } = useShapeIcons(
    firstServiceKey,
    firstService?.star_shape,
  );

  // Use service name if single service, otherwise generic "Rate"
  const isSingleService = services.length === 1;
  const label = isSingleService ? (firstService?.name ?? "Rate") : "Rate";

  // For single numeric service, show the rating value like NumericRatingButton
  const firstRating = metadata?.ratings?.[firstServiceKey] ?? null;
  const showNumericValue =
    isSingleService &&
    firstService?.type === ServiceType.RATING_NUMERICAL &&
    firstRating !== null;

  const content = showNumericValue ? (
    <span className="flex items-center gap-0.5">
      <FirstFilledIcon className="size-4 text-amber-500" />
      <span className="text-base font-semibold tabular-nums">
        {firstRating as number}
      </span>
    </span>
  ) : isSingleService ? (
    <FirstOutlineIcon className="size-6" />
  ) : (
    <IconHeart className="size-6" />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <BottomNavButton
            label={label}
            customContent={content}
            className={className}
            data-menu-open={open}
            truncateLabel={truncateLabel}
          />
        }
      />
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-80 max-w-[90vw]"
      >
        <div className="flex flex-col gap-3">
          {services.map(([serviceKey, service]) => (
            <ServiceRatingControl
              key={serviceKey}
              serviceKey={serviceKey}
              service={service}
              fileId={metadata?.file_id ?? 0}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ServiceRatingControlProps {
  serviceKey: string;
  service: ServiceInfo;
  fileId: number;
}

function ServiceRatingControl({
  serviceKey,
  service,
  fileId,
}: ServiceRatingControlProps) {
  // Get rating directly from the query - this will update when cache updates
  const { data: metadata } = useGetSingleFileMetadata(fileId);
  const currentRating = metadata?.ratings?.[serviceKey] ?? null;

  const { mutate: setRating, isPending } = useSetRatingMutation();

  const handleSetRating = (rating: RatingValue) => {
    setRating({
      file_id: fileId,
      rating_service_key: serviceKey,
      rating,
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Service header - deprioritized */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{service.name}</span>
      </div>

      {/* Rating control based on type */}
      <div>
        {service.type === ServiceType.RATING_LIKE && (
          <LikeDislikeControl
            value={currentRating as boolean | null}
            serviceKey={serviceKey}
            starShape={service.star_shape}
            onChange={handleSetRating}
            disabled={isPending}
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
            disabled={isPending}
          />
        )}
        {service.type === ServiceType.RATING_INC_DEC && (
          <IncDecRatingControl
            value={(currentRating as number | null) ?? 0}
            onChange={handleSetRating}
            disabled={isPending}
          />
        )}
      </div>
    </div>
  );
}
