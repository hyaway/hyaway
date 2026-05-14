// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import type { RuleGroupType, RuleType } from "react-querybuilder";
import type { HydrusTagSearch } from "@/integrations/hydrus-api/models";
import { isIgnorableTagRuleValue } from "@/lib/search-rule-utils";

/** Names of fields that are pure has/does-not-have toggles (no value input ever). */
export const HAS_ONLY_FIELDS = new Set([
  "audio",
  "transparency",
  "exif",
  "icc_profile",
  "embedded_metadata",
  "forced_filetype",
  "duration_presence",
  "framerate_presence",
  "frames_presence",
  "tags_presence",
  "urls_presence",
  "notes_presence",
]);

/** A `["system:has …", "system:no …"]` label pair for has/has_not toggles. */
type HasNoLabels = [`system:has ${string}`, `system:no ${string}`];

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function ruleToSearchTag(rule: RuleType): string | null {
  const { field, operator, value } = rule;

  // Tag field — value is the raw tag string (prefix with - to negate)
  if (field === "tag") {
    if (typeof value !== "string" || isIgnorableTagRuleValue(value)) {
      return null;
    }
    let tag = value.trim();
    if (tag.replace(/^-+/, "") === "") return null;
    // Bare namespace (e.g. "series:" or "-series:") → wildcard
    if (tag.endsWith(":")) tag += "*";
    else if (tag.includes(":") && tag.endsWith(":-")) {
      // handle edge case like "-series:" parsed oddly — shouldn't happen but safe
    }
    return tag;
  }

  // Status fields — standalone, no value needed
  if (field === "inbox") return "system:inbox";
  if (field === "archive") return "system:archive";
  if (field === "everything") return "system:everything";

  // Has / does not have fields (pure toggles — no value input)
  if (HAS_ONLY_FIELDS.has(field)) {
    const fieldLabels: Record<string, HasNoLabels> = {
      audio: ["system:has audio", "system:no audio"],
      transparency: ["system:has transparency", "system:no transparency"],
      exif: ["system:has exif", "system:no exif"],
      icc_profile: ["system:has icc profile", "system:no icc profile"],
      embedded_metadata: [
        "system:has embedded metadata",
        "system:no embedded metadata",
      ],
      forced_filetype: [
        "system:has forced filetype",
        "system:no forced filetype",
      ],
      duration_presence: ["system:has duration", "system:no duration"],
      framerate_presence: ["system:has framerate", "system:no framerate"],
      frames_presence: ["system:has frames", "system:no frames"],
      tags_presence: ["system:has tags", "system:no tags"],
      urls_presence: ["system:has urls", "system:no urls"],
      notes_presence: ["system:has notes", "system:no notes"],
    };

    const [hasLabel, hasNotLabel] = fieldLabels[field];
    return operator === "has" ? hasLabel : hasNotLabel;
  }

  // Rating fields
  if (field.startsWith("rating:")) {
    const serviceName = field.slice("rating:".length);
    if (operator === "has") {
      return `system:has rating for ${serviceName}`;
    }
    if (operator === "has_not") {
      return `system:no rating for ${serviceName}`;
    }
    // Like/dislike ratings use "liked"/"disliked" as values
    if (value === "liked" || value === "disliked") {
      const ratingVal = value === "liked" ? "like" : "dislike";
      return `system:rating for ${serviceName} = ${ratingVal}`;
    }
    if (!value && value !== 0) return null;
    return `system:rating for ${serviceName} ${operator} ${value}`;
  }

  // Comparison / value fields
  if (!value && value !== 0) return null;

  switch (field) {
    case "width":
      return `system:width ${operator} ${value}`;
    case "height":
      return `system:height ${operator} ${value}`;
    case "ratio":
      return `system:ratio ${operator} ${value}`;
    case "num_pixels":
      return `system:num pixels ${operator} ${value}`;
    case "filesize":
      return `system:filesize ${operator} ${value}`;
    case "limit":
      return `system:limit = ${value}`;
    case "filetype":
      return `system:filetype ${operator} ${value}`;
    case "num_tags":
      return `system:number of tags ${operator} ${value}`;
    case "duration_value":
      return `system:duration ${operator} ${value}`;
    case "framerate":
      return `system:framerate ${operator} ${value}`;
    case "file_service":
      return `system:file service ${operator} ${value}`;
    case "num_urls":
      return `system:number of urls ${operator} ${value}`;
    case "num_notes":
      return `system:number of notes ${operator} ${value}`;
    case "num_frames":
      return `system:number of frames ${operator} ${value}`;
    case "import_time":
      return `system:import time ${operator} ${value}`;
    case "modified_time":
      return `system:modified time ${operator} ${value}`;
    case "archived_time":
      return `system:archived time ${operator} ${value}`;
    case "last_viewed_time":
      return `system:last viewed time ${operator} ${value}`;
    case "hash":
      return `system:hash ${operator} ${value}`;
    case "media_views":
      return `system:media views ${operator} ${value}`;
    case "preview_views":
      return `system:preview views ${operator} ${value}`;
    case "all_views":
      return `system:all views ${operator} ${value}`;
    case "media_viewtime":
      return `system:media viewtime ${operator} ${value}`;
    case "preview_viewtime":
      return `system:preview viewtime ${operator} ${value}`;
    case "all_viewtime":
      return `system:all viewtime ${operator} ${value}`;
    case "url_exact":
      return operator === "has"
        ? `system:has url ${value}`
        : `system:does not have url ${value}`;
    case "url_regex":
      return operator === "has"
        ? `system:has url matching regex ${value}`
        : `system:does not have url matching regex ${value}`;
    case "url_domain":
      return operator === "has"
        ? `system:has url with domain ${value}`
        : `system:does not have url with domain ${value}`;
    case "note_name":
      return operator === "has"
        ? `system:has note with name "${value}"`
        : `system:does not have note with name "${value}"`;
    default:
      return null;
  }
}

/**
 * Convert a react-querybuilder tree into HydrusTagSearch.
 *
 * Hydrus search format: `Array<string | Array<string>>`
 * - Top-level entries are ANDed
 * - Inner arrays are ORed
 *
 * Query builder invariant: root group is AND, nested groups are OR, and groups
 * are only nested one level deep.
 */
export function queryToHydrusSearch(query: RuleGroupType): HydrusTagSearch {
  invariant(
    query.combinator === "and",
    "Search query root group must use AND combinator.",
  );

  const result: HydrusTagSearch = [];

  for (const ruleOrGroup of query.rules) {
    if ("rules" in ruleOrGroup) {
      const nested = ruleOrGroup;
      invariant(
        nested.combinator === "or",
        "Search query nested groups must use OR combinator.",
      );

      const orTags: Array<string> = [];
      collectTags(nested, orTags);
      if (orTags.length > 0) {
        result.push(orTags.length === 1 ? orTags[0] : orTags);
      }
    } else {
      const tag = ruleToSearchTag(ruleOrGroup);
      if (tag) result.push(tag);
    }
  }

  return result;
}

/** Recursively collect all tags from a group (flattened). */
function collectTags(group: RuleGroupType, out: Array<string>): void {
  for (const ruleOrGroup of group.rules) {
    invariant(
      !("rules" in ruleOrGroup),
      "Search query OR groups cannot contain nested groups.",
    );

    const tag = ruleToSearchTag(ruleOrGroup);
    if (tag) out.push(tag);
  }
}
