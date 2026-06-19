// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { ServiceType, TagStatus } from "./models";
import type { FileMetadata, ServiceInfo } from "./models";

/** Hydrus add_tags action codes for a local tag service. */
export const TAG_ACTION_ADD = 0;
export const TAG_ACTION_DELETE = 1;
export type TagActionCode = typeof TAG_ACTION_ADD | typeof TAG_ACTION_DELETE;

/**
 * Options for an add_tags call against a single local tag service.
 * `add` and `remove` are combined into one request.
 */
export interface AddFileTagsOptions {
  file_ids: Array<number>;
  service_key: string;
  /** Tags to add (action 0). */
  add?: Array<string>;
  /** Tags to remove (action 1). */
  remove?: Array<string>;
}

/** Request body shape for POST /add_tags/add_tags. */
export interface AddTagsBody {
  file_ids: Array<number>;
  service_keys_to_actions_to_tags: Record<
    string,
    Record<string, Array<string>>
  >;
}

/** Build the add_tags request body combining add (0) and remove (1). */
export function buildAddTagsBody(options: AddFileTagsOptions): AddTagsBody {
  const actions: Record<string, Array<string>> = {};
  if (options.add && options.add.length > 0) {
    actions[String(TAG_ACTION_ADD)] = options.add;
  }
  if (options.remove && options.remove.length > 0) {
    actions[String(TAG_ACTION_DELETE)] = options.remove;
  }
  return {
    file_ids: options.file_ids,
    service_keys_to_actions_to_tags: {
      [options.service_key]: actions,
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

/** A record of a tag change during review, used to reverse it on undo. */
export interface TagRestoreEntry {
  serviceKey: string;
  tag: string;
  /** Whether this swipe added or removed the tag. */
  op: "add" | "remove";
  /** Whether the file already had this tag before the swipe. */
  wasPresent: boolean;
}

/** Result of planning the tag side of a swipe. */
export interface PlannedTagActions {
  /** Unique, trimmed tags to add. */
  add: Array<string>;
  /** Unique, trimmed tags to remove. */
  remove: Array<string>;
  /** Restore entries to record for undo. */
  restore: Array<TagRestoreEntry>;
}

/**
 * Plan the add + remove tags for a swipe plus the restore entries for undo.
 * Dedupes + trims each side. If a tag is listed for both add and remove, the
 * add wins. Records whether each tag was already present so undo only reverses
 * the changes the swipe actually made.
 */
export function planTagActions(
  addActions: ReadonlyArray<{ tag: string }>,
  removeActions: ReadonlyArray<{ tag: string }>,
  serviceKey: string,
  tags: FileMetadata["tags"],
): PlannedTagActions {
  const planned: PlannedTagActions = { add: [], remove: [], restore: [] };

  const addSet = new Set<string>();
  for (const { tag } of addActions) {
    const trimmed = tag.trim();
    if (!trimmed || addSet.has(trimmed)) continue;
    addSet.add(trimmed);
    planned.add.push(trimmed);
    planned.restore.push({
      serviceKey,
      tag: trimmed,
      op: "add",
      wasPresent: tagIsCurrentOnFile(tags, serviceKey, trimmed),
    });
  }

  const removeSet = new Set<string>();
  for (const { tag } of removeActions) {
    const trimmed = tag.trim();
    // Skip blanks, dupes, and any tag also being added (add wins).
    if (!trimmed || removeSet.has(trimmed) || addSet.has(trimmed)) continue;
    removeSet.add(trimmed);
    planned.remove.push(trimmed);
    planned.restore.push({
      serviceKey,
      tag: trimmed,
      op: "remove",
      wasPresent: tagIsCurrentOnFile(tags, serviceKey, trimmed),
    });
  }

  return planned;
}

/**
 * Compute the undo for recorded tag changes: re-add tags the swipe actually
 * removed (were present), and delete tags the swipe actually added (weren't
 * present). Pre-existing/absent tags are left untouched.
 */
export function planTagUndo(restore: ReadonlyArray<TagRestoreEntry>): {
  add: Array<string>;
  remove: Array<string>;
} {
  const add: Array<string> = [];
  const remove: Array<string> = [];
  for (const entry of restore) {
    if (entry.op === "add" && !entry.wasPresent) {
      remove.push(entry.tag);
    } else if (entry.op === "remove" && entry.wasPresent) {
      add.push(entry.tag);
    }
  }
  return { add, remove };
}
