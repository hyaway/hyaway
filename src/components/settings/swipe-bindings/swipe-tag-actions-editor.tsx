// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { IconMinus, IconPlus, IconTag, IconTrash } from "@tabler/icons-react";
import { SwipeActionWarning } from "./swipe-action-warning";
import type { LocalTagServiceInfo } from "@/integrations/hydrus-api/models";
import type {
  LooseTagSwipeAction,
  ReviewSwipeBinding,
  TagSwipeActionType,
} from "@/stores/review-settings-store";
import {
  createSecondarySwipeActionId,
  getSecondarySwipeActionsByType,
  getTagSwipeActionIdentity,
  withUpsertedSecondarySwipeAction,
  withoutSecondarySwipeAction,
} from "@/stores/review-settings-store";
import { Permission } from "@/integrations/hydrus-api/models";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";
import { useCleanTagsMutation } from "@/integrations/hydrus-api/queries/tags";
import { TagAutocompleteInput } from "@/components/tag/tag-autocomplete-input";
import { TagBadgeFromString } from "@/components/tag/tag-badge";
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

function getDefaultLocalTagServiceKey(
  localTagServices: Array<[string, LocalTagServiceInfo]>,
) {
  return (
    localTagServices.find(
      ([, service]) => service.name.trim().toLowerCase() === "my tags",
    )?.[0] ?? localTagServices[0]?.[0]
  );
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

interface SwipeTagActionsEditorProps {
  binding: ReviewSwipeBinding;
  onBindingChange: (binding: ReviewSwipeBinding) => void;
}

export function SwipeTagActionsEditor({
  binding,
  onBindingChange,
}: SwipeTagActionsEditorProps) {
  const { localTagServices } = useLocalTagServices();
  const cleanTagsMutation = useCleanTagsMutation();
  const { hasPermission, isFetched: permissionsFetched } = usePermissions();
  const canEditTags =
    permissionsFetched && hasPermission(Permission.EDIT_FILE_TAGS);
  const allLocalTagServiceKeys = useMemo(
    () => new Set(localTagServices.map(([key]) => key)),
    [localTagServices],
  );
  const tagActions = getSecondarySwipeActionsByType(
    binding.secondaryActions,
    "tag",
  );
  const hasLocalTagServices = localTagServices.length > 0;
  const canAddTag = canEditTags && hasLocalTagServices;

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

  return (
    <div className="flex min-w-0 flex-col gap-2">
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

      {!canEditTags && tagActions.length === 0 ? (
        <span className="text-muted-foreground/50 text-xs">
          No permission to edit file tags
        </span>
      ) : !hasLocalTagServices && tagActions.length === 0 ? (
        <span className="text-muted-foreground/50 text-xs">
          No local tag domains available
        </span>
      ) : null}

      {tagActions.length > 0 && (
        <div className="flex min-w-0 flex-col gap-2">
          {tagActions.map((tagAction) => {
            const actionId = tagAction.id;
            const isOrphanedTag =
              tagAction.serviceKey &&
              !allLocalTagServiceKeys.has(tagAction.serviceKey);

            if (isOrphanedTag) {
              return (
                <SwipeActionWarning
                  key={actionId}
                  variant="destructive"
                  title="Tag service does not exist"
                  description={
                    <>
                      Tag service{" "}
                      <span className="break-all">{tagAction.serviceKey}</span>{" "}
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
      )}

      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          const actionId = createSecondarySwipeActionId("tag");
          upsertTagAction(
            {
              type: "add",
              serviceKey: getDefaultLocalTagServiceKey(localTagServices),
            },
            actionId,
          );
        }}
        disabled={!canAddTag}
      >
        <IconPlus className="size-4" />
        Add tag
      </Button>
    </div>
  );
}
