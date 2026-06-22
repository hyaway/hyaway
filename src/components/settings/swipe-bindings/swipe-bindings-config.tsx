// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo, useRef, useState } from "react";
import {
  IconArchive,
  IconArrowBackUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCopy,
  IconDots,
  IconEdit,
  IconPlayerTrackNext,
  IconPlus,
  IconRestore,
  IconTrash,
} from "@tabler/icons-react";
import { SwipeRatingActionsEditor } from "./swipe-rating-actions-editor";
import { SwipeTagActionsEditor } from "./swipe-tag-actions-editor";
import type {
  ReviewFileAction,
  ReviewSwipeBinding,
  SwipeDirection,
} from "@/stores/review-settings-store";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  DEFAULT_SWIPE_BINDINGS,
  SWIPE_DIRECTIONS,
  useActiveReviewBindingProfile,
  useReviewBindingProfiles,
  useReviewSettingsActions,
  useReviewSwipeBindings,
} from "@/stores/review-settings-store";
import { Permission } from "@/integrations/hydrus-api/models";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useReadOnlyRatingServiceKeys } from "@/stores/ratings-settings-store";
import { Label } from "@/components/ui-primitives/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui-primitives/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui-primitives/select";
import { Input } from "@/components/ui-primitives/input";
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

const PRIMARY_ACTIONS: Array<{
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

// #region Direction Binding Editor

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
  const handlePrimaryActionChange = (value: Array<string>) => {
    const primaryAction = value[0] as ReviewFileAction | undefined;
    // Primary action is required, ignore attempts to clear
    if (!primaryAction) {
      return;
    }
    onBindingChange({
      ...binding,
      fileAction: primaryAction,
      // Undo doesn't support secondary actions — clear them
      ...(primaryAction === "undo" ? { secondaryActions: undefined } : {}),
    });
  };

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

      {/* Primary Action */}
      <div className="flex min-w-0 flex-col gap-2">
        <Label className="text-muted-foreground text-xs">Primary action</Label>
        <ToggleGroup
          value={[binding.fileAction]}
          onValueChange={handlePrimaryActionChange}
          variant="outline"
          size="sm"
          className="flex-wrap justify-start"
        >
          {PRIMARY_ACTIONS.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label}>
              <Icon className="size-4" />
              <span className="hidden @[10rem]:inline">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Tag Actions — hidden when undo is selected (no secondary actions for undo) */}
      {binding.fileAction !== "undo" && (
        <SwipeTagActionsEditor
          binding={binding}
          localTagServices={localTagServices}
          allLocalTagServiceKeys={allLocalTagServiceKeys}
          canEditTags={canEditTags}
          onBindingChange={onBindingChange}
        />
      )}

      {/* Rating Actions — hidden when undo is selected (no secondary actions for undo) */}
      {binding.fileAction !== "undo" && (
        <SwipeRatingActionsEditor
          binding={binding}
          ratingServices={ratingServices}
          allRatingServiceKeys={allRatingServiceKeys}
          readOnlyServiceKeys={readOnlyServiceKeys}
          canEditRatings={canEditRatings}
          onBindingChange={onBindingChange}
        />
      )}
    </div>
  );
}

// #endregion

// #region Binding Profile Controls

function BindingProfileControls({ disabled }: { disabled?: boolean }) {
  const profiles = useReviewBindingProfiles();
  const activeProfile = useActiveReviewBindingProfile();
  const bindings = useReviewSwipeBindings();
  const {
    setActiveBindingProfile,
    createBindingProfile,
    cloneActiveBindingProfile,
    deleteBindingProfile,
    renameBindingProfile,
    resetBindings,
  } = useReviewSettingsActions();
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newProfileSelectValue = "__new-profile__";

  const startRename = useCallback(() => {
    if (disabled) return;
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.focus());
  }, [disabled]);

  const commitRename = useCallback(() => {
    const nextName = renameInputRef.current?.value.trim() ?? "";
    if (nextName) {
      renameBindingProfile(activeProfile.id, nextName);
    }
    setIsRenaming(false);
  }, [activeProfile.id, renameBindingProfile]);

  const isDirectionModified = (direction: SwipeDirection) => {
    const current = bindings[direction];
    const defaultBinding = DEFAULT_SWIPE_BINDINGS[direction];
    return (
      current.fileAction !== defaultBinding.fileAction ||
      (current.secondaryActions?.length ?? 0) > 0
    );
  };

  const hasModifications = SWIPE_DIRECTIONS.some(isDirectionModified);

  return (
    <div className="flex min-w-0 flex-wrap items-end gap-2 rounded-lg border p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Label>Profile</Label>
        <div className="flex min-w-0 items-center gap-1">
          {isRenaming ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                commitRename();
              }}
              className="min-w-0 flex-1 sm:max-w-xs"
            >
              <Input
                ref={renameInputRef}
                aria-label="Profile name"
                defaultValue={activeProfile.name}
                disabled={disabled}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsRenaming(false);
                  }
                }}
                className="h-9 w-full min-w-0"
                autoComplete="off"
              />
            </form>
          ) : (
            <Select
              value={activeProfile.id}
              onValueChange={(profileId) => {
                if (profileId === newProfileSelectValue) {
                  createBindingProfile();
                  return;
                }
                if (profileId) setActiveBindingProfile(profileId);
              }}
              disabled={disabled}
            >
              <SelectTrigger
                aria-label="Profile"
                className="w-full min-w-0 sm:max-w-xs"
              >
                <span className="truncate">{activeProfile.name}</span>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-52">
                <SelectGroup>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={newProfileSelectValue}>
                    <IconPlus />
                    New profile
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={startRename}
            type="button"
            title="Rename"
            aria-label="Rename profile"
            disabled={disabled || isRenaming}
          >
            <IconEdit className="size-5" />
          </Button>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              title="Profile actions"
              aria-label={`Actions for ${activeProfile.name}`}
              disabled={disabled}
            >
              <IconDots className="size-5" />
            </Button>
          }
        />
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => createBindingProfile()}>
            <IconPlus />
            New profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={cloneActiveBindingProfile}>
            <IconCopy />
            Clone
          </DropdownMenuItem>
          <DropdownMenuItem onClick={startRename}>
            <IconEdit />
            Rename
          </DropdownMenuItem>
          {hasModifications && (
            <DropdownMenuItem onClick={resetBindings}>
              <IconRestore />
              Reset actions
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => deleteBindingProfile(activeProfile.id)}
            variant="destructive"
          >
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
 * Allows setting a primary action and optional secondary actions for each swipe direction.
 */
export function SwipeBindingsConfig({
  className,
  showHeader = true,
  disabled = false,
  columns = 2,
}: SwipeBindingsConfigProps) {
  const bindings = useReviewSwipeBindings();
  const { setBinding } = useReviewSettingsActions();
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

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Swipe Actions</h3>
            <p className="text-muted-foreground text-sm">
              Configure what happens when you swipe in each direction.
            </p>
          </div>
        </div>
      )}

      <BindingProfileControls disabled={disabled} />

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
