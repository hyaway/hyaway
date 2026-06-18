// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ServiceType, TagStatus } from "./models";
import type { FileMetadata, ServiceInfo } from "./models";

/** Hydrus add_tags action codes for a local tag service. */
export const TAG_ACTION_ADD = 0;
export const TAG_ACTION_DELETE = 1;
export type TagActionCode = typeof TAG_ACTION_ADD | typeof TAG_ACTION_DELETE;

/** Options for an add_tags call against a single local tag service. */
export interface AddFileTagsOptions {
  file_ids: Array<number>;
  service_key: string;
  tags: Array<string>;
  action: TagActionCode;
}

/** Request body shape for POST /add_tags/add_tags. */
export interface AddTagsBody {
  file_ids: Array<number>;
  service_keys_to_actions_to_tags: Record<
    string,
    Record<string, Array<string>>
  >;
}

/** Build the add_tags request body for one service + action. */
export function buildAddTagsBody(options: AddFileTagsOptions): AddTagsBody {
  return {
    file_ids: options.file_ids,
    service_keys_to_actions_to_tags: {
      [options.service_key]: {
        [options.action]: options.tags,
      },
    },
  };
}

/** Filter a services record to local (writable) tag services. */
export function selectLocalTagServices(
  services: Record<string, ServiceInfo> | undefined,
): Array<[string, ServiceInfo]> {
  if (!services) return [];
  return Object.entries(services).filter(
    ([, service]) => service.type === ServiceType.LOCAL_TAG_DOMAIN,
  );
}

/**
 * Resolve which local tag service tags should target.
 * - 0 services -> null
 * - exactly 1 -> that service (configured key ignored)
 * - many -> the configured key if still valid, else null
 */
export function resolveTagServiceKey(
  localTagServices: ReadonlyArray<[string, ServiceInfo]>,
  configuredKey: string | null,
): string | null {
  if (localTagServices.length === 0) return null;
  if (localTagServices.length === 1) return localTagServices[0][0];
  if (configuredKey && localTagServices.some(([k]) => k === configuredKey)) {
    return configuredKey;
  }
  return null;
}

/** True when `tag` is a current display tag on the file for the given service. */
export function tagIsCurrentOnFile(
  tags: FileMetadata["tags"],
  serviceKey: string,
  tag: string,
): boolean {
  const current = tags?.[serviceKey]?.display_tags[TagStatus.CURRENT];
  return current?.includes(tag) ?? false;
}

/** A record of a tag added during review, used to reverse it on undo. */
export interface TagRestoreEntry {
  serviceKey: string;
  tag: string;
  /** Whether the file already had this tag before the swipe. */
  wasPresent: boolean;
}

/** Result of planning the tag side of a swipe. */
export interface PlannedTagActions {
  /** Unique, trimmed tags to add. */
  tags: Array<string>;
  /** Restore entries to record for undo. */
  restore: Array<TagRestoreEntry>;
}

/**
 * Plan the tags to add for a swipe plus the restore entries for undo.
 * Dedupes + trims tags and records whether each was already present.
 */
export function planTagActions(
  tagActions: ReadonlyArray<{ tag: string }>,
  serviceKey: string,
  tags: FileMetadata["tags"],
): PlannedTagActions {
  const seen = new Set<string>();
  const planned: PlannedTagActions = { tags: [], restore: [] };

  for (const { tag } of tagActions) {
    const trimmed = tag.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    planned.tags.push(trimmed);
    planned.restore.push({
      serviceKey,
      tag: trimmed,
      wasPresent: tagIsCurrentOnFile(tags, serviceKey, trimmed),
    });
  }

  return planned;
}

/** Tags to delete on undo — only those the swipe actually added. */
export function tagsToRemoveOnUndo(
  restore: ReadonlyArray<TagRestoreEntry>,
): Array<string> {
  return restore.filter((entry) => !entry.wasPresent).map((entry) => entry.tag);
}
