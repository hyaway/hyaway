// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { HAS_ONLY_FIELDS } from "./query-to-hydrus-search";
import type { Field, OptionGroup } from "react-querybuilder";
import type { RatingServiceInfo } from "@/integrations/hydrus-api/models";
import {
  HydrusFileSortType,
  ServiceType,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

export const tagOperators = [{ name: "=", label: "is" }];

export const comparisonOperators = [
  { name: "=", label: "is equal to (=)" },
  { name: "≠", label: "is not equal to (≠)" },
  { name: ">", label: "is greater than (>)" },
  { name: "<", label: "is less than (<)" },
  { name: "≈", label: "is approximately (≈)" },
];

function hasOps(thing: string): Array<{ name: string; label: string }> {
  return [
    { name: "has", label: `has ${thing}` },
    { name: "has_not", label: `no ${thing}` },
  ];
}

const filetypeValues = [
  { name: "image", label: "image" },
  { name: "video", label: "video" },
  { name: "animation", label: "animation" },
  { name: "audio", label: "audio" },
  { name: "application", label: "application" },
];

/** Time comparison operators with labels that work for both deltas and dates. */
const timeComparisonOperators = [
  { name: "<", label: "more recent than (<)" },
  { name: ">", label: "older than (>)" },
  { name: "=", label: "exactly (=)" },
  { name: "≈", label: "around (≈)" },
];

const ratioOperators = [
  { name: "=", label: "is (=)" },
  { name: "wider than", label: "wider than" },
  { name: "taller than", label: "taller than" },
  { name: "≈", label: "is approximately (≈)" },
];

const likeRatingOperators = [
  { name: "=", label: "is (=)" },
  { name: "has", label: "has rating" },
  { name: "has_not", label: "no rating" },
];

const numericalRatingOperators = [
  { name: "=", label: "is equal to (=)" },
  { name: ">", label: "is greater than (>)" },
  { name: "<", label: "is less than (<)" },
  { name: "has", label: "has rating" },
  { name: "has_not", label: "no rating" },
];

// ---------------------------------------------------------------------------
// Field groups
// ---------------------------------------------------------------------------

/**
 * Extended OptionGroup with a display hint.
 * `inline: true` renders each option at the top level of the field selector
 * instead of grouping them behind a drill-down category.
 */
export type DisplayOptionGroup = OptionGroup<Field> & { inline?: boolean };

export const fieldGroups: Array<DisplayOptionGroup> = [
  {
    label: "basics",
    inline: true,
    options: [
      {
        name: "tag",
        label: "tag",
        operators: tagOperators,
        defaultValue: "",
        placeholder: "tag",
      },
      {
        name: "inbox",
        label: "inbox",
        operators: [{ name: "is", label: "is" }],
      },
      {
        name: "archive",
        label: "archive",
        operators: [{ name: "is", label: "is" }],
      },
      {
        name: "everything",
        label: "everything",
        operators: [{ name: "is", label: "is" }],
      },
      {
        name: "limit",
        label: "limit",
        operators: [{ name: "=", label: "=" }],
        inputType: "number",
        defaultValue: "256",
      },
    ],
  },
  {
    label: "system:file properties",
    options: [
      { name: "audio", label: "audio", operators: hasOps("audio") },
      {
        name: "transparency",
        label: "transparency",
        operators: hasOps("transparency"),
      },
      { name: "exif", label: "exif", operators: hasOps("exif") },
      {
        name: "icc_profile",
        label: "icc profile",
        operators: hasOps("icc profile"),
      },
      {
        name: "embedded_metadata",
        label: "embedded metadata",
        operators: hasOps("embedded metadata"),
      },
      {
        name: "forced_filetype",
        label: "forced filetype",
        operators: hasOps("forced filetype"),
      },
    ],
  },
  {
    label: "system:dimensions",
    options: [
      {
        name: "width",
        label: "width",
        operators: comparisonOperators,
        defaultOperator: "=",
        inputType: "number",
        defaultValue: "1920",
      },
      {
        name: "height",
        label: "height",
        operators: comparisonOperators,
        defaultOperator: "=",
        inputType: "number",
        defaultValue: "1080",
      },
      {
        name: "ratio",
        label: "ratio",
        operators: ratioOperators,
        defaultOperator: "=",
        defaultValue: "16:9",
      },
      {
        name: "num_pixels",
        label: "num pixels",
        operators: comparisonOperators,
        defaultOperator: "≈",
        defaultValue: "2 megapixels",
      },
    ],
  },
  {
    label: "system:duration",
    options: [
      {
        name: "duration_presence",
        label: "duration",
        operators: hasOps("duration"),
      },
      {
        name: "duration_value",
        label: "duration",
        operators: comparisonOperators,
        defaultOperator: ">",
        defaultValue: "5 seconds",
      },
      {
        name: "framerate_presence",
        label: "framerate",
        operators: hasOps("framerate"),
      },
      {
        name: "framerate",
        label: "framerate",
        operators: comparisonOperators,
        defaultOperator: "≈",
        inputType: "number",
        defaultValue: "60",
      },
      {
        name: "frames_presence",
        label: "frames",
        operators: hasOps("frames"),
      },
      {
        name: "num_frames",
        label: "number of frames",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "600",
      },
    ],
  },
  {
    label: "system:file",
    options: [
      {
        name: "filetype",
        label: "filetype",
        operators: [
          { name: "is", label: "is" },
          { name: "is not", label: "is not" },
        ],
        valueEditorType: "select",
        values: filetypeValues,
        defaultValue: "image",
      },
      {
        name: "filesize",
        label: "filesize",
        operators: comparisonOperators,
        defaultOperator: "<",
        defaultValue: "200 KB",
      },
      {
        name: "hash",
        label: "hash",
        operators: [{ name: "=", label: "is" }],
        defaultValue: "",
      },
      {
        name: "file_service",
        label: "file service",
        operators: [
          { name: "is currently in", label: "is currently in" },
          { name: "is not currently in", label: "is not currently in" },
        ],
        valueEditorType: "select",
        values: [],
        defaultValue: "my files",
      },
    ],
  },
  {
    label: "system:tags",
    options: [
      { name: "tags_presence", label: "tags", operators: hasOps("tags") },
      {
        name: "num_tags",
        label: "number of tags",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "4",
      },
    ],
  },
  {
    label: "system:time",
    options: [
      {
        name: "import_time",
        label: "import time",
        operators: timeComparisonOperators,
        defaultOperator: "<",
        defaultValue: "7 days",
      },
      {
        name: "modified_time",
        label: "modified time",
        operators: timeComparisonOperators,
        defaultOperator: "<",
        defaultValue: "7 days",
      },
      {
        name: "archived_time",
        label: "archived time",
        operators: timeComparisonOperators,
        defaultOperator: "<",
        defaultValue: "7 days",
      },
      {
        name: "last_viewed_time",
        label: "last viewed time",
        operators: timeComparisonOperators,
        defaultOperator: "<",
        defaultValue: "7 days",
      },
    ],
  },
  {
    label: "system:urls",
    options: [
      {
        name: "url_exact",
        label: "URL (exact)",
        operators: hasOps("matching URL"),
        defaultValue: "",
      },
      {
        name: "url_regex",
        label: "URL (regex)",
        operators: hasOps("matching URL"),
        defaultValue: "",
      },
      {
        name: "url_domain",
        label: "URL (domain)",
        operators: hasOps("matching URL"),
        defaultValue: "",
      },
      { name: "urls_presence", label: "URLs", operators: hasOps("urls") },
      {
        name: "num_urls",
        label: "number of URLs",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "1",
      },
    ],
  },
  {
    label: "system:notes",
    options: [
      {
        name: "note_name",
        label: "note with name",
        operators: hasOps("note with name"),
        defaultValue: "",
      },
      {
        name: "notes_presence",
        label: "notes",
        operators: hasOps("notes"),
      },
      {
        name: "num_notes",
        label: "number of notes",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "0",
      },
    ],
  },
  {
    label: "system:file viewing statistics",
    options: [
      {
        name: "media_views",
        label: "media views",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "10",
      },
      {
        name: "preview_views",
        label: "preview views",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "10",
      },
      {
        name: "all_views",
        label: "all views",
        operators: comparisonOperators,
        defaultOperator: ">",
        inputType: "number",
        defaultValue: "10",
      },
      {
        name: "media_viewtime",
        label: "media viewtime",
        operators: comparisonOperators,
        defaultOperator: ">",
        defaultValue: "0 hours 10 minutes 0 seconds",
      },
      {
        name: "preview_viewtime",
        label: "preview viewtime",
        operators: comparisonOperators,
        defaultOperator: ">",
        defaultValue: "0 hours 10 minutes 0 seconds",
      },
      {
        name: "all_viewtime",
        label: "all viewtime",
        operators: comparisonOperators,
        defaultOperator: ">",
        defaultValue: "0 hours 10 minutes 0 seconds",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Dynamic rating fields
// ---------------------------------------------------------------------------

/**
 * Build the rating field groups dynamically from API-discovered services.
 * Each rating type gets appropriate operators:
 * - Like/dislike: has/no/liked/disliked (no value needed)
 * - Numerical: has/no + comparison (value = star count)
 * - Inc/Dec: has/no + comparison (value = counter)
 */
export function buildRatingFieldGroups(
  ratingServices: Array<[string, RatingServiceInfo]>,
): Array<OptionGroup<Field>> {
  if (ratingServices.length === 0) return [];

  const options: Array<Field> = ratingServices.map(([serviceKey, service]) => {
    if (isLikeRatingService(service)) {
      return {
        name: `rating:${service.name}`,
        label: service.name,
        operators: likeRatingOperators,
        defaultOperator: "=",
        defaultValue: "liked",
        valueEditorType: "select" as const,
        values: [
          { name: "liked", label: "liked" },
          { name: "disliked", label: "disliked" },
        ],
        ratingServiceKey: serviceKey,
        ratingService: service,
      };
    }

    if (isNumericalRatingService(service)) {
      return {
        name: `rating:${service.name}`,
        label: service.name,
        operators: numericalRatingOperators,
        defaultOperator: "=",
        inputType: "number" as const,
        defaultValue: String(service.max_stars),
        ratingServiceKey: serviceKey,
        ratingService: service,
      };
    }

    // Inc/Dec
    return {
      name: `rating:${service.name}`,
      label: service.name,
      operators: numericalRatingOperators,
      defaultOperator: ">",
      inputType: "number" as const,
      defaultValue: "0",
      ratingServiceKey: serviceKey,
      ratingService: service,
    };
  });

  return [{ label: "system:rating", options }];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** File-domain service types shown in the "file service" dropdown. */
export const FILE_SERVICE_TYPES = new Set([
  ServiceType.LOCAL_FILE_DOMAIN,
  ServiceType.TRASH,
  ServiceType.ALL_MY_FILES,
  ServiceType.FILE_REPOSITORY,
]);

/** Status fields that are standalone with no value input. */
const STATUS_FIELDS = new Set(["inbox", "archive", "everything"]);

/** Operators that need no value input (has/has_not toggles). */
const NO_VALUE_OPERATORS = new Set(["has", "has_not"]);

/** Fields that require a value even when using has/has_not operators. */
const HAS_WITH_VALUE_FIELDS = new Set([
  "note_name",
  "url_exact",
  "url_regex",
  "url_domain",
]);

/** Checks if a field+operator combo needs no value input. */
export const isNoValueField = (field: string, operator: string): boolean =>
  HAS_ONLY_FIELDS.has(field) ||
  STATUS_FIELDS.has(field) ||
  (NO_VALUE_OPERATORS.has(operator) && !HAS_WITH_VALUE_FIELDS.has(field));

/**
 * Extra search keywords for fields, so e.g. "has tags" matches "number of tags".
 * Maps field name → array of additional keyword strings.
 */
export const FIELD_SEARCH_KEYWORDS: Record<string, Array<string>> = {};

/**
 * Map field names to their hydrus display prefix.
 * Used in the field selector to show how the field appears in the hydrus query.
 */
export const FIELD_HYDRUS_LABEL: Record<string, string> = {
  tag: "tag",
  inbox: "system:inbox",
  archive: "system:archive",
  everything: "system:everything",
  audio: "system:has audio",
  transparency: "system:has transparency",
  exif: "system:has exif",
  icc_profile: "system:has icc profile",
  embedded_metadata: "system:has embedded metadata",
  forced_filetype: "system:has forced filetype",
  note_name: "system:has note with name",
  width: "system:width",
  height: "system:height",
  ratio: "system:ratio",
  num_pixels: "system:num pixels",
  duration_presence: "system:has duration",
  duration_value: "system:duration",
  framerate_presence: "system:has framerate",
  framerate: "system:framerate",
  frames_presence: "system:has frames",
  filetype: "system:filetype",
  filesize: "system:filesize",
  limit: "system:limit",
  hash: "system:hash",
  file_service: "system:file service",
  tags_presence: "system:has tags",
  num_tags: "system:number of tags",
  urls_presence: "system:has urls",
  num_urls: "system:number of urls",
  notes_presence: "system:has notes",
  num_notes: "system:number of notes",
  num_frames: "system:number of frames",
  import_time: "system:import time",
  modified_time: "system:modified time",
  archived_time: "system:archived time",
  last_viewed_time: "system:last viewed time",
  media_views: "system:media views",
  preview_views: "system:preview views",
  all_views: "system:all views",
  media_viewtime: "system:media viewtime",
  preview_viewtime: "system:preview viewtime",
  all_viewtime: "system:all viewtime",
  url_exact: "system:has url",
  url_regex: "system:has url matching regex",
  url_domain: "system:has url with domain",
};

const SYSTEM_TAG_RULE_ENTRIES: Array<
  [string, { field: string; operator: string; value?: string }]
> = [
  ["system:has audio", { field: "audio", operator: "has" }],
  ["system:no audio", { field: "audio", operator: "has_not" }],
  ["system:has transparency", { field: "transparency", operator: "has" }],
  ["system:no transparency", { field: "transparency", operator: "has_not" }],
  ["system:has exif", { field: "exif", operator: "has" }],
  ["system:no exif", { field: "exif", operator: "has_not" }],
  ["system:has icc profile", { field: "icc_profile", operator: "has" }],
  ["system:no icc profile", { field: "icc_profile", operator: "has_not" }],
  [
    "system:has embedded metadata",
    { field: "embedded_metadata", operator: "has" },
  ],
  [
    "system:no embedded metadata",
    { field: "embedded_metadata", operator: "has_not" },
  ],
  ["system:has forced filetype", { field: "forced_filetype", operator: "has" }],
  [
    "system:no forced filetype",
    { field: "forced_filetype", operator: "has_not" },
  ],
  ["system:has duration", { field: "duration_presence", operator: "has" }],
  ["system:no duration", { field: "duration_presence", operator: "has_not" }],
  ["system:has framerate", { field: "framerate_presence", operator: "has" }],
  ["system:no framerate", { field: "framerate_presence", operator: "has_not" }],
  ["system:has frames", { field: "frames_presence", operator: "has" }],
  ["system:no frames", { field: "frames_presence", operator: "has_not" }],
  ["system:has tags", { field: "tags_presence", operator: "has" }],
  ["system:no tags", { field: "tags_presence", operator: "has_not" }],
  ["system:has urls", { field: "urls_presence", operator: "has" }],
  ["system:no urls", { field: "urls_presence", operator: "has_not" }],
  ["system:has notes", { field: "notes_presence", operator: "has" }],
  ["system:no notes", { field: "notes_presence", operator: "has_not" }],
  ["system:has url", { field: "url_exact", operator: "has" }],
  ["system:does not have url", { field: "url_exact", operator: "has_not" }],
  ["system:has url matching regex", { field: "url_regex", operator: "has" }],
  [
    "system:does not have url matching regex",
    { field: "url_regex", operator: "has_not" },
  ],
  ["system:has url with domain", { field: "url_domain", operator: "has" }],
  [
    "system:does not have url with domain",
    { field: "url_domain", operator: "has_not" },
  ],
  ["system:has note with name", { field: "note_name", operator: "has" }],
  [
    "system:does not have note with name",
    { field: "note_name", operator: "has_not" },
  ],
];

/** All unique `system:*` tag values used in tag suggestions. */
export const SYSTEM_TAGS: Array<string> = [
  ...new Set(
    [
      ...Object.values(FIELD_HYDRUS_LABEL),
      ...SYSTEM_TAG_RULE_ENTRIES.map(([tag]) => tag),
    ].filter((v) => v.startsWith("system:")),
  ),
];

/** Reverse map: system tag string → field name. */
const SYSTEM_TAG_TO_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_HYDRUS_LABEL)
    .filter(([, v]) => v.startsWith("system:"))
    .map(([k, v]) => [v, k]),
);

const SYSTEM_TAG_TO_RULE: Partial<
  Record<string, { field: string; operator: string; value?: string }>
> = Object.fromEntries(SYSTEM_TAG_RULE_ENTRIES);

/**
 * Resolve a system tag string (e.g. `"system:inbox"`) to a query builder rule.
 * Returns `undefined` if the tag is not a known system tag.
 */
export function systemTagToRule(
  systemTag: string,
): { field: string; operator: string; value: string } | undefined {
  const explicitRule = SYSTEM_TAG_TO_RULE[systemTag];
  if (explicitRule) {
    return {
      field: explicitRule.field,
      operator: explicitRule.operator,
      value: String(explicitRule.value ?? ""),
    };
  }

  const fieldName = SYSTEM_TAG_TO_FIELD[systemTag];
  if (!fieldName) return undefined;

  // Look up the field definition for its default operator/value
  for (const group of fieldGroups) {
    const field = group.options.find((f) => f.name === fieldName);
    if (field) {
      return {
        field: fieldName,
        operator:
          (field as { defaultOperator?: string }).defaultOperator ?? "=",
        value: String(field.defaultValue ?? ""),
      };
    }
  }
  return { field: fieldName, operator: "=", value: "" };
}

/** Get hydrus-style display label for a field, with fallback. */
export function getFieldHydrusLabel(fieldName: string): string {
  if (FIELD_HYDRUS_LABEL[fieldName]) return FIELD_HYDRUS_LABEL[fieldName];
  if (fieldName.startsWith("rating:"))
    return `system:rating for ${fieldName.slice("rating:".length)}`;
  return fieldName;
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

export const SORT_OPTIONS = [
  { value: HydrusFileSortType.ImportTime, label: "import time" },
  { value: HydrusFileSortType.ModifiedTime, label: "modified time" },
  { value: HydrusFileSortType.LastViewedTime, label: "last viewed time" },
  { value: HydrusFileSortType.ArchiveTimestamp, label: "archive time" },
  { value: HydrusFileSortType.FileSize, label: "file size" },
  { value: HydrusFileSortType.FileType, label: "file type" },
  { value: HydrusFileSortType.Duration, label: "duration" },
  { value: HydrusFileSortType.Framerate, label: "framerate" },
  { value: HydrusFileSortType.NumberOfFrames, label: "number of frames" },
  { value: HydrusFileSortType.Width, label: "width" },
  { value: HydrusFileSortType.Height, label: "height" },
  { value: HydrusFileSortType.Ratio, label: "ratio" },
  { value: HydrusFileSortType.NumberOfPixels, label: "number of pixels" },
  { value: HydrusFileSortType.NumberOfTags, label: "number of tags" },
  { value: HydrusFileSortType.NumberOfMediaViews, label: "media views" },
  { value: HydrusFileSortType.TotalMediaViewtime, label: "total view time" },
  { value: HydrusFileSortType.ApproximateBitrate, label: "bitrate" },
  { value: HydrusFileSortType.HasAudio, label: "has audio" },
  { value: HydrusFileSortType.Random, label: "random" },
  { value: HydrusFileSortType.HashHex, label: "hash" },
] as const;

/** Build a display string like "system:sort by import time ▲" for a sort config. */
export function getSortLabel(
  sortType: HydrusFileSortType,
  sortAsc: boolean,
): string {
  const label =
    SORT_OPTIONS.find((o) => o.value === sortType)?.label ?? "import time";
  return `Sort by ${label} ${sortAsc ? "asc" : "desc"}`;
}
