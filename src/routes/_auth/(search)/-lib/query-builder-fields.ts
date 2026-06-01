// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { HAS_ONLY_FIELDS } from "./query-to-hydrus-search";
import {
  SYSTEM_RATING_GROUP_LABEL,
  getRatingFieldName,
  getRatingSystemTag,
  getRatingSystemTags,
  isRatingFieldName,
  parseRatingSystemTag,
} from "./rating-predicate-utils";
import type { Field, OptionGroup } from "react-querybuilder";
import type { RatingServiceInfo } from "@/integrations/hydrus-api/models";
import type { SearchRuleInput } from "@/stores/search-defaults";
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
  { name: ">=", label: "is greater than or equal to (>=)" },
  { name: "<", label: "is less than (<)" },
  { name: "<=", label: "is less than or equal to (<=)" },
  { name: "≈", label: "is approximately (≈)" },
];

const exactComparisonOperators = [
  { name: "=", label: "is equal to (=)" },
  { name: ">", label: "is greater than (>)" },
  { name: ">=", label: "is greater than or equal to (>=)" },
  { name: "<", label: "is less than (<)" },
  { name: "<=", label: "is less than or equal to (<=)" },
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
  { name: "<=", label: "on or more recent than (<=)" },
  { name: ">", label: "older than (>)" },
  { name: ">=", label: "on or older than (>=)" },
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
  { name: ">=", label: "is greater than or equal to (>=)" },
  { name: "<", label: "is less than (<)" },
  { name: "<=", label: "is less than or equal to (<=)" },
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
          // Hydrus also accepts "is pending to" / "is not pending to", but
          // those repository workflow states are excluded from hyAway browsing.
        ],
        defaultOperator: "is currently in",
        valueEditorType: "select",
        values: [],
        defaultValue: "my files",
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
        operators: exactComparisonOperators,
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
// Rating service fields
// ---------------------------------------------------------------------------

function isRatingGroup(group: OptionGroup<Field>): boolean {
  return group.label === SYSTEM_RATING_GROUP_LABEL;
}

function getSystemFieldOption(field: Field): SystemFieldOption {
  return { name: getFieldHydrusLabel(field.name), label: field.label };
}

/**
 * Build rating field groups from API-discovered services.
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
        name: getRatingFieldName(service.name),
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
        name: getRatingFieldName(service.name),
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
      name: getRatingFieldName(service.name),
      label: service.name,
      operators: numericalRatingOperators,
      defaultOperator: ">",
      inputType: "number" as const,
      defaultValue: "0",
      ratingServiceKey: serviceKey,
      ratingService: service,
    };
  });

  return [{ label: SYSTEM_RATING_GROUP_LABEL, options }];
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

const SYSTEM_TAG_SEARCH_KEYWORDS: Record<string, Array<string>> = {
  "system:inbox": ["new", "unprocessed", "unarchived", "to review"],
  "system:archive": ["archived", "processed", "not inbox"],
  "system:everything": ["all", "all files"],
  "system:limit": ["max", "maximum", "result count", "results"],

  "system:has audio": ["sound", "has sound", "with audio", "music"],
  "system:no audio": ["silent", "mute", "muted", "no sound", "without audio"],
  "system:has transparency": [
    "transparent",
    "transparency",
    "alpha",
    "has alpha",
    "alpha channel",
  ],
  "system:no transparency": [
    "opaque",
    "no alpha",
    "without alpha",
    "without transparency",
  ],
  "system:has exif": ["metadata", "camera metadata", "photo metadata"],
  "system:no exif": ["no metadata", "without exif"],
  "system:has icc profile": ["icc", "color profile", "profile"],
  "system:no icc profile": ["no icc", "no color profile"],
  "system:has embedded metadata": [
    "embedded metadata",
    "human readable embedded metadata",
    "human-readable embedded metadata",
    "metadata",
  ],
  "system:no embedded metadata": [
    "no embedded metadata",
    "no human readable embedded metadata",
    "no human-readable embedded metadata",
    "without metadata",
  ],
  "system:has forced filetype": ["filetype override", "forced type"],
  "system:no forced filetype": ["no filetype override", "normal filetype"],

  "system:width": ["wide", "horizontal", "resolution"],
  "system:height": ["tall", "vertical", "resolution"],
  "system:ratio": [
    "aspect",
    "aspect ratio",
    "wider than",
    "taller than",
    "landscape",
    "portrait",
    "square",
  ],
  "system:num pixels": [
    "pixels",
    "number of pixels",
    "number pixels",
    "num of pixels",
    "megapixels",
    "kilopixels",
    "resolution",
    "large image",
    "small image",
  ],

  "system:has duration": [
    "video",
    "animation",
    "animated",
    "has length",
    "duration has duration",
  ],
  "system:no duration": ["still", "image", "no length", "duration no duration"],
  "system:duration": [
    "length",
    "long video",
    "short video",
    "runtime",
    "seconds",
    "minutes",
    "milliseconds",
  ],
  "system:has framerate": ["fps", "frame rate", "framerate has framerate"],
  "system:no framerate": ["no fps", "no frame rate", "framerate no framerate"],
  "system:framerate": ["fps", "frame rate"],
  "system:has frames": [
    "frame count",
    "has frames",
    "number of frames has frames",
  ],
  "system:no frames": [
    "no frames",
    "without frames",
    "number of frames no frames",
  ],
  "system:number of frames": [
    "frames",
    "frame count",
    "num frames",
    "number frames",
    "num of frames",
  ],

  "system:filetype": [
    "mime",
    "type",
    "extension",
    "file type",
    "image",
    "video",
    "gif",
    "static gif",
    "animated gif",
    "webm",
    "jpg",
    "png",
  ],
  "system:filesize": [
    "size",
    "file size",
    "large file",
    "small file",
    "bytes",
    "mb",
    "kb",
    "kilobytes",
    "megabytes",
    "gigabytes",
  ],
  "system:hash": ["sha256", "md5", "sha1", "sha512", "file hash"],
  "system:file service": [
    "service",
    "local files",
    "trash",
    "repository",
    "currently in",
    "not currently in",
    "pending to",
    "not pending to",
  ],

  "system:has tags": ["tagged", "with tags", "number of tags has tags"],
  "system:untagged": [
    "no tags",
    "without tags",
    "missing tags",
    "number of tags no tags",
  ],
  "system:number of tags": [
    "tag count",
    "many tags",
    "few tags",
    "num tags",
    "number tags",
    "num of tags",
  ],

  "system:has urls": [
    "url",
    "source",
    "source url",
    "has source",
    "has urls",
    "number of urls has urls",
    "num urls > 0",
  ],
  "system:no urls": [
    "no url",
    "no source",
    "missing source",
    "without urls",
    "number of urls no urls",
    "num urls = 0",
  ],
  "system:number of urls": [
    "url count",
    "source count",
    "num urls",
    "number urls",
    "num of urls",
  ],
  "system:has url": ["exact url", "source url", "has_url"],
  "system:does not have url": [
    "no exact url",
    "without url",
    "doesn't have url",
    "does not have url",
  ],
  "system:has url matching regex": [
    "regex",
    "url regex",
    "matches url",
    "has a url matching regex",
  ],
  "system:does not have url matching regex": [
    "no regex match",
    "url not matching regex",
    "doesn't have url matching regex",
    "does not have a url matching regex",
  ],
  "system:has url with domain": [
    "domain",
    "has domain",
    "site",
    "website",
    "source domain",
    "source site",
    "url with domain",
  ],
  "system:does not have url with domain": [
    "not domain",
    "not site",
    "without domain",
    "doesn't have domain",
    "does not have domain",
  ],

  "system:has notes": [
    "notes",
    "with notes",
    "number of notes has notes",
    "num notes > 0",
  ],
  "system:no notes": [
    "no notes",
    "missing notes",
    "without notes",
    "number of notes no notes",
    "num notes = 0",
  ],
  "system:number of notes": [
    "note count",
    "num notes",
    "number notes",
    "num of notes",
  ],
  "system:has note with name": [
    "note name",
    "named note",
    "note named",
    "has a note with name",
    "has note named",
  ],
  "system:does not have note with name": [
    "no note name",
    "missing note",
    "no note with name",
    "doesn't have note with name",
    "does not have a note with name",
  ],

  "system:import time": [
    "imported",
    "added",
    "recent",
    "new files",
    "old files",
    "import date",
    "imported date",
    "imported time",
    "time imported",
    "date imported",
  ],
  "system:modified time": [
    "modified",
    "changed",
    "edited",
    "modified date",
    "date modified",
    "time modified",
  ],
  "system:archived time": [
    "archive date",
    "archive time",
    "archived",
    "archived date",
    "date archived",
    "time archived",
  ],
  "system:last viewed time": [
    "viewed",
    "last seen",
    "recently viewed",
    "last view date",
    "last view time",
    "last viewed date",
    "date last viewed",
    "time last viewed",
  ],

  "system:media views": [
    "views",
    "watched",
    "opened",
    "media view count",
    "views in media",
  ],
  "system:preview views": [
    "preview",
    "thumbnail views",
    "preview count",
    "views in preview",
  ],
  "system:all views": ["total views", "view count", "views in media preview"],
  "system:media viewtime": [
    "watch time",
    "view time",
    "time watched",
    "viewtime in media",
  ],
  "system:preview viewtime": [
    "preview time",
    "thumbnail time",
    "viewtime in preview",
  ],
  "system:all viewtime": [
    "total view time",
    "all watch time",
    "viewtime in media preview",
  ],
};

/**
 * Extra search keywords for fields and system predicates.
 * Maps field or predicate name -> array of additional keyword strings.
 */
export const FIELD_SEARCH_KEYWORDS: Record<string, Array<string>> = {
  ...SYSTEM_TAG_SEARCH_KEYWORDS,
};

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

const SYSTEM_TAG_RULE_ENTRIES = [
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
  ["system:untagged", { field: "tags_presence", operator: "has_not" }],
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
] as const satisfies ReadonlyArray<readonly [string, SearchRuleInput]>;

/** All unique `system:*` tag values used in tag suggestions. */
export const SYSTEM_TAGS: Array<string> = [
  ...new Set(
    [
      ...Object.values(FIELD_HYDRUS_LABEL),
      ...SYSTEM_TAG_RULE_ENTRIES.map(([tag]) => tag),
    ].filter((v) => v.startsWith("system:")),
  ),
];

export type SystemTagSuggestion = {
  value: string;
  keywords?: Array<string>;
};

export type SystemFieldOption = { name: string; label: string };

export type SystemFieldOptionGroup = {
  label: string;
  inline?: boolean;
  options: Array<SystemFieldOption>;
};

export function buildSystemTags(
  groups: Array<OptionGroup<Field>> = fieldGroups,
): Array<string> {
  return [
    ...new Set(
      [
        ...SYSTEM_TAGS,
        ...groups.flatMap((group) =>
          group.options.flatMap((field) => {
            if (!isRatingFieldName(field.name)) return [];
            return getRatingSystemTags(field.name);
          }),
        ),
      ].filter((v) => v.startsWith("system:")),
    ),
  ];
}

export function buildSystemTagSuggestions(
  groups: Array<OptionGroup<Field>> = fieldGroups,
): Array<SystemTagSuggestion> {
  return buildSystemTags(groups).map((value) => ({
    value,
    keywords: SYSTEM_TAG_SEARCH_KEYWORDS[value],
  }));
}

export function buildSystemFieldOptions(
  groups: Array<OptionGroup<Field>> = fieldGroups,
): Array<SystemFieldOptionGroup> {
  const systemTags = buildSystemTags(groups);

  return groups
    .map((group) => ({
      label: group.label,
      inline: (group as { inline?: boolean }).inline,
      options: group.options
        .filter((field) => field.name !== "tag")
        .flatMap((field) => {
          if (isRatingGroup(group)) {
            return [getSystemFieldOption(field)];
          }

          const fieldSystemTags = systemTags.filter(
            (tag) => systemTagToRule(tag, groups)?.field === field.name,
          );

          if (fieldSystemTags.length === 0) {
            return [getSystemFieldOption(field)];
          }

          return fieldSystemTags.map((tag) => ({ name: tag, label: tag }));
        }),
    }))
    .filter((group) => group.options.length > 0);
}

export function buildSystemFieldSelectorGroups(
  groups: Array<OptionGroup<Field>> = fieldGroups,
): Array<OptionGroup<Field>> {
  const systemTags = buildSystemTags(groups);

  return groups
    .map((group) => ({
      ...group,
      options: group.options
        .filter((field) => field.name !== "tag")
        .flatMap((field) => {
          if (isRatingGroup(group)) {
            return [
              {
                ...field,
                name: getRatingSystemTag(field.name),
                label: field.label,
              },
            ];
          }

          const systemPredicateOptions = systemTags
            .filter((tag) => systemTagToRule(tag, groups)?.field === field.name)
            .map((tag) => ({ ...field, name: tag, label: tag }));

          return systemPredicateOptions.length > 1
            ? systemPredicateOptions
            : [field];
        }),
    }))
    .filter((group) => group.options.length > 0);
}

export function getSelectedSystemTagForRule(
  field: string,
  operator: string | undefined,
  groups: Array<OptionGroup<Field>> = fieldGroups,
): string | undefined {
  return buildSystemTags(groups).find((tag) => {
    const rule = systemTagToRule(tag, groups);
    if (!rule) return false;
    return rule.field === field && rule.operator === operator;
  });
}

export function fieldHasSystemPredicateChoices(
  field: string,
  groups: Array<OptionGroup<Field>> = fieldGroups,
): boolean {
  return (
    buildSystemTags(groups).filter(
      (tag) => systemTagToRule(tag, groups)?.field === field,
    ).length > 1
  );
}

export const SYSTEM_TAG_SUGGESTIONS: Array<SystemTagSuggestion> =
  buildSystemTagSuggestions();

/** Reverse map: system tag string → field name. */
const SYSTEM_TAG_TO_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_HYDRUS_LABEL)
    .filter(([, v]) => v.startsWith("system:"))
    .map(([k, v]) => [v, k]),
);

const SYSTEM_TAG_TO_RULE: Partial<Record<string, SearchRuleInput>> =
  Object.fromEntries(SYSTEM_TAG_RULE_ENTRIES);

function getFieldDefaultRule(
  fieldName: string,
  groups: Array<OptionGroup<Field>>,
): SearchRuleInput {
  for (const group of groups) {
    const field = group.options.find((f) => f.name === fieldName);
    if (field) {
      return {
        field: fieldName,
        operator:
          (field as { defaultOperator?: string }).defaultOperator ?? "=",
        value: String(field.defaultValue ?? ""),
      } as SearchRuleInput;
    }
  }
  return { field: fieldName, operator: "=", value: "" } as SearchRuleInput;
}

function systemRatingTagToRule(
  systemTag: string,
  groups: Array<OptionGroup<Field>>,
): SearchRuleInput | undefined {
  const parsed = parseRatingSystemTag(systemTag);
  if (!parsed) return undefined;

  if (parsed.kind === "rating") {
    return getFieldDefaultRule(parsed.fieldName, groups);
  }

  return { field: parsed.fieldName, operator: parsed.kind, value: "" };
}

/**
 * Resolve a system tag string (e.g. `"system:inbox"`) to a query builder rule.
 * Returns `undefined` if the tag is not a known system tag.
 */
export function systemTagToRule(
  systemTag: string,
  groups: Array<OptionGroup<Field>> = fieldGroups,
): SearchRuleInput | undefined {
  const explicitRule = SYSTEM_TAG_TO_RULE[systemTag];
  if (explicitRule) {
    return explicitRule;
  }

  const ratingRule = systemRatingTagToRule(systemTag, groups);
  if (ratingRule) return ratingRule;

  const fieldName = SYSTEM_TAG_TO_FIELD[systemTag];
  if (!fieldName) return undefined;

  return getFieldDefaultRule(fieldName, groups);
}

/** Get hydrus-style display label for a field, with fallback. */
export function getFieldHydrusLabel(fieldName: string): string {
  if (FIELD_HYDRUS_LABEL[fieldName]) return FIELD_HYDRUS_LABEL[fieldName];
  if (isRatingFieldName(fieldName)) return getRatingSystemTag(fieldName);
  return fieldName;
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

export const SORT_OPTIONS = [
  {
    value: HydrusFileSortType.ImportTime,
    label: "import time",
    ascLabel: "oldest first",
    descLabel: "newest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.ModifiedTime,
    label: "modified time",
    ascLabel: "oldest first",
    descLabel: "newest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.LastViewedTime,
    label: "last viewed time",
    ascLabel: "oldest first",
    descLabel: "newest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.ArchiveTimestamp,
    label: "archived time",
    ascLabel: "oldest first",
    descLabel: "newest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.FileSize,
    label: "file size",
    ascLabel: "smallest first",
    descLabel: "largest first",
    defaultAsc: false,
  },
  { value: HydrusFileSortType.FileType, label: "file type" },
  {
    value: HydrusFileSortType.Duration,
    label: "duration",
    ascLabel: "shortest first",
    descLabel: "longest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.Framerate,
    label: "framerate",
    ascLabel: "slowest first",
    descLabel: "fastest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.NumberOfFrames,
    label: "number of frames",
    ascLabel: "smallest first",
    descLabel: "largest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.NumberOfCollectionFiles,
    label: "files in collection",
    ascLabel: "fewest first",
    descLabel: "most first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.Width,
    label: "width",
    ascLabel: "thinnest first",
    descLabel: "widest first",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.Height,
    label: "height",
    ascLabel: "shortest first",
    descLabel: "tallest first",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.Ratio,
    label: "resolution ratio",
    ascLabel: "tallest first",
    descLabel: "widest first",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.NumberOfPixels,
    label: "number of pixels",
    ascLabel: "fewest first",
    descLabel: "most first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.NumberOfTags,
    label: "number of tags",
    ascLabel: "fewest first",
    descLabel: "most first",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.NumberOfMediaViews,
    label: "views",
    ascLabel: "fewest first",
    descLabel: "most first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.TotalMediaViewtime,
    label: "view time",
    ascLabel: "shortest first",
    descLabel: "longest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.ApproximateBitrate,
    label: "approximate bitrate",
    ascLabel: "smallest first",
    descLabel: "largest first",
    defaultAsc: false,
  },
  {
    value: HydrusFileSortType.HasAudio,
    label: "has audio",
    ascLabel: "audio first",
    descLabel: "silent first",
    defaultAsc: true,
  },
  { value: HydrusFileSortType.Random, label: "random" },
  {
    value: HydrusFileSortType.HashHex,
    label: "hash (SHA-256)",
    ascLabel: "lexicographic",
    descLabel: "reverse lexicographic",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.PixelHashHex,
    label: "pixel hash",
    ascLabel: "lexicographic",
    descLabel: "reverse lexicographic",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.Blurhash,
    label: "blurhash",
    ascLabel: "lexicographic",
    descLabel: "reverse lexicographic",
    defaultAsc: true,
  },
  {
    value: HydrusFileSortType.AverageColourLightness,
    label: "lightness",
    ascLabel: "darkest first",
    descLabel: "lightest first",
    defaultAsc: false,
    ascColorHex: "#404040",
    descColorHex: "#d4d4d4",
  },
  {
    value: HydrusFileSortType.AverageColourChromaticMagnitude,
    label: "chromatic magnitude",
    ascLabel: "greys first",
    descLabel: "colours first",
    defaultAsc: false,
    ascColorHex: "#737373",
    descColorHex: "#a855f7",
  },
  {
    value: HydrusFileSortType.AverageColourGreenRedAxis,
    label: "green-red balance",
    ascLabel: "greens first",
    descLabel: "reds first",
    defaultAsc: true,
    ascColorHex: "#16a34a",
    descColorHex: "#dc2626",
  },
  {
    value: HydrusFileSortType.AverageColourBlueYellowAxis,
    label: "blue-yellow balance",
    ascLabel: "blues first",
    descLabel: "yellows first",
    defaultAsc: true,
    ascColorHex: "#2563eb",
    descColorHex: "#eab308",
  },
  {
    value: HydrusFileSortType.AverageColourHue,
    label: "hue",
    ascLabel: "red first",
    descLabel: "purple first",
    defaultAsc: true,
    ascColorHex: "#dc2626",
    descColorHex: "#9333ea",
  },
] as const;

export function getSortOption(sortType: HydrusFileSortType) {
  return SORT_OPTIONS.find((o) => o.value === sortType) ?? SORT_OPTIONS[0];
}

export function getDefaultSortAsc(sortType: HydrusFileSortType): boolean {
  const option = getSortOption(sortType);
  return "defaultAsc" in option ? option.defaultAsc : false;
}

export function getSortOrderLabel(
  sortType: HydrusFileSortType,
  sortAsc: boolean,
): string | undefined {
  const option = getSortOption(sortType);
  if (!("ascLabel" in option) || !("descLabel" in option)) return undefined;
  return sortAsc ? option.ascLabel : option.descLabel;
}

export function getSortColorHex(
  sortType: HydrusFileSortType,
  sortAsc = getDefaultSortAsc(sortType),
): string | undefined {
  const option = getSortOption(sortType);
  if (!("ascColorHex" in option) || !("descColorHex" in option)) {
    return undefined;
  }

  return sortAsc ? option.ascColorHex : option.descColorHex;
}

/** Build a display string like "system:sort by import time ▲" for a sort config. */
export function getSortLabel(
  sortType: HydrusFileSortType,
  sortAsc: boolean,
): string {
  const option = getSortOption(sortType);
  const orderLabel = getSortOrderLabel(sortType, sortAsc);
  return orderLabel
    ? `Sort by ${option.label} (${orderLabel})`
    : `Sort by ${option.label}`;
}
