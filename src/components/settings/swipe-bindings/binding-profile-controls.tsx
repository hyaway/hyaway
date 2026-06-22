// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef, useState } from "react";
import {
  IconCopy,
  IconDots,
  IconEdit,
  IconPlus,
  IconRestore,
  IconTrash,
} from "@tabler/icons-react";
import {
  SWIPE_DIRECTIONS,
  isReviewSwipeBindingModified,
  useActiveReviewBindingProfile,
  useReviewBindingProfiles,
  useReviewSettingsActions,
  useReviewSwipeBindings,
} from "@/stores/review-settings-store";
import { Button } from "@/components/ui-primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import { Input } from "@/components/ui-primitives/input";
import { Label } from "@/components/ui-primitives/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui-primitives/select";

interface BindingProfileControlsProps {
  disabled?: boolean;
}

export function BindingProfileControls({
  disabled,
}: BindingProfileControlsProps) {
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

  const hasModifications = SWIPE_DIRECTIONS.some((direction) =>
    isReviewSwipeBindingModified(direction, bindings[direction]),
  );

  return (
    <div className="@container/profile-controls flex min-w-0 flex-wrap items-end gap-2 rounded-lg border p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3 @lg/profile-controls:flex-row @lg/profile-controls:items-center">
        <Label>Profile</Label>
        <div className="flex min-w-0 flex-1 items-center gap-1">
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
