// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconBackslash,
  IconChevronDown,
  IconChevronRight,
  IconMinus,
  IconPlus,
  IconPlusMinus,
  IconSortAscending2Filled,
  IconSortDescending2Filled,
  IconTrash,
} from "@tabler/icons-react";
import { defaultFilter } from "cmdk";
import {
  QueryBuilder,
  isOptionGroupArray,
  useValueSelector,
} from "react-querybuilder";
import type {
  ActionProps,
  Field,
  OptionGroup,
  RuleGroupType,
  RuleType,
  ValueEditorProps,
  VersatileSelectorProps,
} from "react-querybuilder";
import type { CSSProperties } from "react";
import type {
  HydrusTagSearch,
  RatingServiceInfo,
  StarShape,
} from "@/integrations/hydrus-api/models";
import {
  HydrusFileSortType,
  Permission,
  ServiceType,
  isLikeRatingService,
  isNumericalRatingService,
} from "@/integrations/hydrus-api/models";
import { useHasPermission } from "@/integrations/hydrus-api/queries/access";
import { useGetServicesQuery } from "@/integrations/hydrus-api/queries/services";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useShapeIcons } from "@/components/ratings/use-shape-icons";
import {
  getDislikeColors,
  getIncDecPositiveColors,
  getLikeColors,
  getNumericalFilledColors,
} from "@/components/ratings/rating-colors";
import { NumericalRatingControl } from "@/components/ratings/rating-controls";
import { Button } from "@/components/ui-primitives/button";
import { Switch } from "@/components/ui-primitives/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui-primitives/command";
import { Input } from "@/components/ui-primitives/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui-primitives/popover";
import { cn } from "@/lib/utils";
import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { parseTag } from "@/lib/tag-utils";
import { useActiveTheme } from "@/stores/theme-store";
import {
  useAllowSystemOnlySearch,
  useSearchSettingsActions,
} from "@/stores/search-settings-store";
import { OrTagBadge, TagBadgeFromString } from "@/components/tag/tag-badge";
import { useSearchTagsQuery } from "@/integrations/hydrus-api/queries/tags";
import { useNamespaceColors } from "@/integrations/hydrus-api/queries/options";

// ---------------------------------------------------------------------------
// Field & operator definitions
// ---------------------------------------------------------------------------

const tagOperators = [{ name: "=", label: "is" }];

const comparisonOperators = [
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

/** Comparison operators with has/has_not prepended. */
function comparisonWithHasOps(
  thing: string,
): Array<{ name: string; label: string }> {
  return [...hasOps(thing), ...comparisonOperators];
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

/**
 * Extended OptionGroup with a display hint.
 * `inline: true` renders each option at the top level of the field selector
 * instead of grouping them behind a drill-down category.
 */
type DisplayOptionGroup = OptionGroup<Field> & { inline?: boolean };

const fieldGroups: Array<DisplayOptionGroup> = [
  {
    label: "basics",
    inline: true,
    options: [
      {
        name: "tag",
        label: "tag",
        operators: tagOperators,
        defaultValue: "",
        placeholder: "character:samus aran",
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
        name: "duration_value",
        label: "duration",
        operators: comparisonWithHasOps("duration"),
        defaultOperator: ">",
        defaultValue: "5 seconds",
      },
      {
        name: "framerate",
        label: "framerate",
        operators: comparisonWithHasOps("framerate"),
        defaultOperator: "≈",
        inputType: "number",
        defaultValue: "60",
      },
      {
        name: "num_frames",
        label: "number of frames",
        operators: comparisonWithHasOps("frames"),
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
    label: "system:number of tags",
    options: [
      {
        name: "num_tags",
        label: "number of tags",
        operators: [
          { name: "has", label: "has tags" },
          { name: "has_not", label: "no tags" },
          ...comparisonOperators,
        ],
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
      {
        name: "num_urls",
        label: "number of URLs",
        operators: comparisonWithHasOps("urls"),
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
        name: "num_notes",
        label: "number of notes",
        operators: comparisonWithHasOps("notes"),
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

/**
 * Build the rating field groups dynamically from API-discovered services.
 * Each rating type gets appropriate operators:
 * - Like/dislike: has/no/liked/disliked (no value needed)
 * - Numerical: has/no + comparison (value = star count)
 * - Inc/Dec: has/no + comparison (value = counter)
 */
function buildRatingFieldGroups(
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
        // Extra data for the value editor
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

  return [
    {
      label: "system:rating",
      options,
    },
  ];
}

/** File-domain service types shown in the "file service" dropdown. */
const FILE_SERVICE_TYPES = new Set([
  ServiceType.LOCAL_FILE_DOMAIN,
  ServiceType.TRASH,
  ServiceType.ALL_MY_FILES,
  ServiceType.FILE_REPOSITORY,
]);

/** Names of fields that are pure has/does-not-have toggles (no value input ever). */
const HAS_ONLY_FIELDS = new Set([
  "audio",
  "transparency",
  "exif",
  "icc_profile",
  "embedded_metadata",
  "forced_filetype",
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

/** A `["system:has …", "system:no …"]` label pair for has/has_not toggles. */
type HasNoLabels = [`system:has ${string}`, `system:no ${string}`];

/** Checks if a field+operator combo needs no value input. */
const isNoValueField = (field: string, operator: string): boolean =>
  HAS_ONLY_FIELDS.has(field) ||
  STATUS_FIELDS.has(field) ||
  (NO_VALUE_OPERATORS.has(operator) && !HAS_WITH_VALUE_FIELDS.has(field));

/**
 * Extra search keywords for fields, so e.g. "has tags" matches "number of tags".
 * Maps field name → array of additional keyword strings.
 */
const FIELD_SEARCH_KEYWORDS: Record<string, Array<string>> = {
  duration_value: ["has duration", "no duration"],
  framerate: ["has framerate", "no framerate"],
  num_frames: ["has frames", "no frames"],
  num_tags: ["has tags", "no tags"],

  num_urls: ["has urls", "no urls"],
  num_notes: ["has notes", "no notes"],
};

// ---------------------------------------------------------------------------
// Conversion: react-querybuilder rule → hydrus search tag string
// ---------------------------------------------------------------------------

/**
 * Map field names to their hydrus display prefix.
 * Used in the field selector to show how the field appears in the hydrus query.
 */
const FIELD_HYDRUS_LABEL: Record<string, string> = {
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
  duration_value: "system:duration",
  framerate: "system:framerate",
  filetype: "system:filetype",
  filesize: "system:filesize",
  limit: "system:limit",
  hash: "system:hash",
  file_service: "system:file service",
  num_tags: "system:number of tags",
  num_urls: "system:number of urls",
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

/** Get hydrus-style display label for a field, with fallback. */
function getFieldHydrusLabel(fieldName: string): string {
  if (FIELD_HYDRUS_LABEL[fieldName]) return FIELD_HYDRUS_LABEL[fieldName];
  if (fieldName.startsWith("rating:"))
    return `system:rating for ${fieldName.slice("rating:".length)}`;
  return fieldName;
}

/** Convert a react-querybuilder query tree to hydrus search tags. */
export { queryToHydrusSearch };

function ruleToSearchTag(rule: RuleType): string | null {
  const { field, operator, value } = rule;

  // Tag field — value is the raw tag string (prefix with - to negate)
  if (field === "tag") {
    if (typeof value !== "string" || value.trim().length === 0) return null;
    let tag = value.trim();
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
    };

    const [hasLabel, hasNotLabel] = fieldLabels[field];
    return operator === "has" ? hasLabel : hasNotLabel;
  }

  // Has/has_not operator on fields with both toggle and comparison modes
  if (operator === "has" || operator === "has_not") {
    const hasLabels: Partial<Record<string, HasNoLabels>> = {
      duration_value: ["system:has duration", "system:no duration"],
      framerate: ["system:has framerate", "system:no framerate"],
      num_frames: ["system:has frames", "system:no frames"],
      num_tags: ["system:has tags", "system:no tags"],

      num_urls: ["system:has urls", "system:no urls"],
      num_notes: ["system:has notes", "system:no notes"],
    };

    const labels = hasLabels[field];
    if (labels) {
      const [hasLabel, hasNotLabel] = labels;
      return operator === "has" ? hasLabel : hasNotLabel;
    }
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
 * So an AND group's rules become separate top-level entries,
 * and an OR group's rules become a single inner array.
 */
function queryToHydrusSearch(query: RuleGroupType): HydrusTagSearch {
  const result: HydrusTagSearch = [];

  for (const ruleOrGroup of query.rules) {
    if ("rules" in ruleOrGroup) {
      // Nested group
      const nested = ruleOrGroup;
      if (nested.combinator === "or") {
        // OR group → collect all tags into a single inner array
        const orTags: Array<string> = [];
        collectTags(nested, orTags);
        if (orTags.length > 0) {
          result.push(orTags.length === 1 ? orTags[0] : orTags);
        }
      } else {
        // AND sub-group → flatten into top-level AND entries
        const subResult = queryToHydrusSearch(nested);
        result.push(...subResult);
      }
    } else {
      const tag = ruleToSearchTag(ruleOrGroup);
      if (tag) result.push(tag);
    }
  }

  // Handle top-level OR: if the root itself is OR, wrap everything
  if (query.combinator === "or" && result.length > 1) {
    // All tags at this level should be ORed
    const flat: Array<string> = [];
    for (const entry of result) {
      if (Array.isArray(entry)) {
        flat.push(...entry);
      } else {
        flat.push(entry);
      }
    }
    return [flat];
  }

  return result;
}

/** Recursively collect all tags from a group (flattened). */
function collectTags(group: RuleGroupType, out: Array<string>): void {
  for (const ruleOrGroup of group.rules) {
    if ("rules" in ruleOrGroup) {
      collectTags(ruleOrGroup, out);
    } else {
      const tag = ruleToSearchTag(ruleOrGroup);
      if (tag) out.push(tag);
    }
  }
}

// ---------------------------------------------------------------------------
// Custom control components (using project ui-primitives)
// ---------------------------------------------------------------------------

/** Field selector — QBSelect with namespace colors enabled. */
function QBFieldSelect(props: VersatileSelectorProps) {
  return <QBSelect {...props} colorLabels />;
}

/** Operator selector — hides for 1 option, switch for 2, combobox for 3+ */
function QBOperatorSelect(props: VersatileSelectorProps) {
  const flatOptions = isOptionGroupArray(props.options)
    ? (props.options as Array<{ options: Array<unknown> }>).flatMap(
        (g) => g.options,
      )
    : (props.options as Array<{ name: string; label: string }>);

  if (flatOptions.length <= 1) return null;

  // Two options → toggle switch with labels
  if (flatOptions.length === 2) {
    const [first, second] = flatOptions as Array<{
      name: string;
      label: string;
    }>;
    const isFirst = props.value === first.name;
    return (
      <div className="inline-flex items-center gap-1.5 px-1.5">
        <span
          className={cn(
            "text-sm transition-colors",
            !isFirst ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {second.label}
        </span>
        <Switch
          size="default"
          checked={isFirst}
          onCheckedChange={(checked) =>
            props.handleOnChange(checked ? first.name : second.name)
          }
          disabled={props.disabled}
        />
        <span
          className={cn(
            "text-sm transition-colors",
            isFirst ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {first.label}
        </span>
      </div>
    );
  }

  return <QBSelect {...props} />;
}

/** Combobox using Popover + Command — used for field + operator.
 *  For grouped options (field selector): shows categories first, drill into a
 *  category to see its fields. Typing in search searches everything flat.
 *  For flat options (operator selector): shows all options directly.
 */
function QBSelect({
  handleOnChange,
  options,
  value,
  title,
  disabled,
  className,
  colorLabels,
}: VersatileSelectorProps & { colorLabels?: boolean }) {
  const [open, setOpen] = useState(false);
  /** The currently drilled-into group label, or null for the top-level view. */
  const [activePage, setActivePage] = useState<string | null>(null);
  /** Track whether the user has typed anything in the search input. */
  const [search, setSearch] = useState("");

  const { onChange, val } = useValueSelector({
    handleOnChange,
    listsAsArrays: false,
    multiple: false,
    value,
  });

  // Reset drill-down state when popover closes
  useEffect(() => {
    if (!open) {
      setActivePage(null);
      setSearch("");
    }
  }, [open]);

  type OptionItem = { name: string; label: string };
  type OptionGroupItem = {
    label: string;
    inline?: boolean;
    options: Array<OptionItem>;
  };

  const isGrouped = isOptionGroupArray(options);
  const groups = isGrouped ? (options as Array<OptionGroupItem>) : null;
  const namespaceColors = useNamespaceColors();

  /** Get inline color style for a label based on its namespace. */
  const labelStyle = (label: string): CSSProperties | undefined => {
    const { namespace } = parseTag(label);
    const color =
      namespaceColors[namespace || "null"] ?? namespaceColors["null"];
    return color ? { color } : undefined;
  };

  // Resolve the display label for the current value
  const selectedLabel = useMemo(() => {
    if (groups) {
      for (const og of groups) {
        const found = og.options.find((o) => o.name === val);
        if (found) {
          return getFieldHydrusLabel(found.name);
        }
      }
    } else {
      const found = (options as Array<OptionItem>).find((o) => o.name === val);
      if (found) return found.label;
    }
    return null;
  }, [options, groups, val]);

  const selectField = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  // When typing, show flat search across all fields.
  // When not typing and on top-level, show group headings as selectable items.
  // When drilled into a page, show that page's options.
  const isSearching = search.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50 lg:w-auto lg:max-w-96 lg:min-w-60",
          className,
        )}
        aria-label={title}
      >
        <span
          className="truncate"
          style={
            colorLabels && selectedLabel ? labelStyle(selectedLabel) : undefined
          }
        >
          {selectedLabel ?? title ?? "Select…"}
        </span>
        <IconChevronDown className="text-muted-foreground size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[70dvh] w-80 p-0"
        align="start"
        side="right"
        alignOffset={-4}
        sideOffset={-240}
        positionMethod="fixed"
      >
        <Command
          shouldFilter={isSearching}
          filter={(itemValue, searchTerm, keywords) => {
            // Short queries: exact substring match only (no fuzzy).
            // Longer queries: fuzzy with a minimum score threshold.
            if (searchTerm.length < 3) {
              const haystack = [itemValue, ...(keywords ?? [])]
                .join(" ")
                .toLowerCase();
              return haystack.includes(searchTerm.toLowerCase()) ? 1 : 0;
            }
            const score = defaultFilter(itemValue, searchTerm, keywords);
            return score > 0.05 ? score : 0;
          }}
        >
          <CommandInput
            placeholder={`Search ${title?.toLowerCase() ?? ""}…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-none">
            <CommandEmpty>No results.</CommandEmpty>
            {groups ? (
              isSearching ? (
                // Flat search across all groups
                groups.map((og) => (
                  <CommandGroup key={og.label} heading={og.label}>
                    {og.options.map((opt) => (
                      <CommandItem
                        key={opt.name}
                        value={opt.name}
                        keywords={[
                          opt.label,
                          // Include group label as keyword only for
                          // non-inline groups so users can search by
                          // category (e.g. "dimensions" finds "width").
                          // Inline groups use a generic label like
                          // "basics" that would cause fuzzy false
                          // positives.
                          ...(og.inline ? [] : [og.label]),
                          getFieldHydrusLabel(opt.name),
                          ...(FIELD_SEARCH_KEYWORDS[opt.name] ?? []),
                        ]}
                        data-checked={val === opt.name}
                        onSelect={() => selectField(opt.name)}
                      >
                        <span style={labelStyle(getFieldHydrusLabel(opt.name))}>
                          {getFieldHydrusLabel(opt.name)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              ) : activePage === null ? (
                // Top-level: inline groups (single-option or marked inline)
                // render their options directly; others are drill-down categories
                <CommandGroup>
                  {[...groups]
                    .sort(
                      (a, b) =>
                        (a.inline || a.options.length === 1 ? 0 : 1) -
                        (b.inline || b.options.length === 1 ? 0 : 1),
                    )
                    .flatMap((og) =>
                      og.inline || og.options.length === 1 ? (
                        og.options.map((opt) => (
                          <CommandItem
                            key={opt.name}
                            value={opt.name}
                            keywords={[opt.label, og.label]}
                            data-checked={val === opt.name}
                            onSelect={() => selectField(opt.name)}
                          >
                            <span
                              style={labelStyle(getFieldHydrusLabel(opt.name))}
                            >
                              {getFieldHydrusLabel(opt.name)}
                            </span>
                          </CommandItem>
                        ))
                      ) : (
                        <CommandItem
                          key={og.label}
                          value={og.label}
                          data-checked={og.options.some((o) => o.name === val)}
                          onSelect={() => setActivePage(og.label)}
                        >
                          <span className="flex-1" style={labelStyle(og.label)}>
                            {og.label}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {og.options.length}
                          </span>
                          <IconChevronRight className="text-muted-foreground size-3.5" />
                        </CommandItem>
                      ),
                    )}
                </CommandGroup>
              ) : (
                // Drilled into a specific group
                <>
                  <CommandGroup>
                    <CommandItem
                      value="__back"
                      onSelect={() => setActivePage(null)}
                    >
                      <IconArrowLeft className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground">
                        {activePage}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup>
                    {groups
                      .find((og) => og.label === activePage)
                      ?.options.map((opt) => (
                        <CommandItem
                          key={opt.name}
                          value={opt.name}
                          keywords={[
                            opt.label,
                            ...(FIELD_SEARCH_KEYWORDS[opt.name] ?? []),
                          ]}
                          data-checked={val === opt.name}
                          onSelect={() => selectField(opt.name)}
                        >
                          <span
                            style={labelStyle(getFieldHydrusLabel(opt.name))}
                          >
                            {getFieldHydrusLabel(opt.name)}
                          </span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )
            ) : (
              // Flat options (operator selector)
              (options as Array<OptionItem>).map((opt) => (
                <CommandItem
                  key={opt.name}
                  value={opt.name}
                  keywords={[opt.label]}
                  data-checked={val === opt.name}
                  onSelect={() => selectField(opt.name)}
                >
                  {opt.label}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Action button using our Button primitive */
function QBActionElement({
  handleOnClick,
  label,
  title,
  disabled,
  disabledTranslation,
  className,
  level,
}: ActionProps) {
  const isRemove =
    typeof label === "string" && (label === "⨯" || title?.includes("Remove"));
  const isAddGroup = typeof label === "string" && label.includes("Group");

  if (isRemove) {
    return (
      <Button
        variant="ghost"
        size="default"
        className={cn(
          "text-muted-foreground hover:text-destructive",
          className,
        )}
        title={
          disabledTranslation && disabled ? disabledTranslation.title : title
        }
        onClick={(e) => handleOnClick(e)}
        disabled={disabled && !disabledTranslation}
        type="button"
      >
        <IconTrash data-icon="inline-start" className="size-5" />
        {title?.includes("group") ? "Remove group" : "Remove"}
      </Button>
    );
  }

  if (isAddGroup) {
    // Only allow adding OR groups at root level (level 0).
    // Sub-groups (level >= 1) cannot have nested groups.
    if (level > 0) return null;
    return (
      <Button
        variant="outline"
        size="default"
        className={className}
        title={title}
        onClick={(e) => handleOnClick(e)}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add OR group
      </Button>
    );
  }

  // Add rule: show separate "Add tag" and "Add filter" buttons
  return (
    <>
      <Button
        variant="outline"
        size="default"
        className={className}
        onClick={(e) => handleOnClick(e, { addTag: true })}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add tag
      </Button>
      <Button
        variant="outline"
        size="default"
        className={className}
        onClick={(e) => handleOnClick(e, { addSystem: true })}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add system
      </Button>
      <Button
        variant="outline"
        size="default"
        className={className}
        onClick={(e) => handleOnClick(e, { addLimit: true })}
        disabled={disabled}
        type="button"
      >
        <IconPlus data-icon="inline-start" className="size-5" />
        Add limit
      </Button>
    </>
  );
}

/** Value editor using our Input primitive */
function QBValueEditor(props: ValueEditorProps) {
  const { field, fieldData, value, handleOnChange, values, title, disabled } =
    props;
  const operator = props.rule.operator;

  // Has/does-not-have fields and no-value operators need no value input
  if (isNoValueField(field, operator)) {
    return null;
  }

  // Rating fields — render type-specific value editors with icons
  if (field.startsWith("rating:") && fieldData.ratingService) {
    const service = fieldData.ratingService as RatingServiceInfo;
    const serviceKey = fieldData.ratingServiceKey as string;

    if (isLikeRatingService(service)) {
      return (
        <LikeDislikeValueEditor
          value={value}
          onChange={handleOnChange}
          serviceKey={serviceKey}
          service={service}
          disabled={disabled}
        />
      );
    }

    if (isNumericalRatingService(service)) {
      return (
        <NumericalValueEditor
          value={value}
          onChange={handleOnChange}
          serviceKey={serviceKey}
          service={service}
          disabled={disabled}
        />
      );
    }

    // Inc/Dec — plain number input with service icon
    return (
      <IncDecValueEditor
        value={value}
        onChange={handleOnChange}
        service={service}
        disabled={disabled}
      />
    );
  }

  // Tag field — plain text input (user types the tag)
  if (field === "tag") {
    return (
      <TagValueEditor
        value={value ?? ""}
        onChange={handleOnChange}
        disabled={disabled}
      />
    );
  }

  // Select-based value editors
  if (fieldData.valueEditorType === "select" && values) {
    return (
      <QBSelect
        handleOnChange={handleOnChange}
        options={values}
        value={value ?? ""}
        title={title}
        disabled={disabled}
        path={props.path}
        level={props.level}
        schema={props.schema}
        rule={props.rule}
      />
    );
  }

  return (
    <Input
      type={fieldData.inputType === "number" ? "number" : "text"}
      className="w-full lg:w-auto lg:max-w-96 lg:min-w-40"
      name={`hyaway-spb-${field}`}
      value={value ?? ""}
      disabled={disabled}
      title={title}
      autoComplete="off"
      onChange={(e) => handleOnChange(e.target.value)}
    />
  );
}

// ---------------------------------------------------------------------------
// Rating value editors with service-specific icons
// ---------------------------------------------------------------------------

/** Like/dislike value: two icon toggle buttons for liked / disliked */
function LikeDislikeValueEditor({
  value,
  onChange,
  serviceKey,
  service,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  serviceKey: string;
  service: RatingServiceInfo;
  disabled?: boolean;
}) {
  const { filled: FilledIcon, outline: OutlineIcon } = useShapeIcons(
    serviceKey,
    service.star_shape,
  );
  const likeColors = getLikeColors(service);
  const dislikeColors = getDislikeColors(service);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("size-9 p-0", value === "liked" && "bg-muted")}
        onClick={() => onChange("liked")}
        disabled={disabled}
        aria-label="Liked"
        aria-pressed={value === "liked"}
        type="button"
      >
        {value === "liked" ? (
          <FilledIcon
            className="size-5"
            style={{ color: likeColors.brush, stroke: likeColors.pen }}
            strokeWidth={1.5}
          />
        ) : (
          <OutlineIcon className="size-5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("size-9 p-0", value === "disliked" && "bg-muted")}
        onClick={() => onChange("disliked")}
        disabled={disabled}
        aria-label="Disliked"
        aria-pressed={value === "disliked"}
        type="button"
      >
        <span
          className="relative"
          style={
            value === "disliked"
              ? { color: dislikeColors.brush, stroke: dislikeColors.pen }
              : undefined
          }
        >
          {value === "disliked" ? (
            <FilledIcon className="size-5" strokeWidth={1.5} />
          ) : (
            <OutlineIcon className="size-5" />
          )}
          <IconBackslash
            className="text-background pointer-events-none absolute -inset-1.5 size-8"
            strokeWidth={3}
          />
          <IconBackslash
            className="pointer-events-none absolute -inset-1.5 size-8"
            style={
              value === "disliked" ? { color: dislikeColors.brush } : undefined
            }
            strokeWidth={1.5}
          />
        </span>
      </Button>
    </div>
  );
}

/** Numerical rating value: star picker using NumericalRatingControl */
function NumericalValueEditor({
  value,
  onChange,
  serviceKey,
  service,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  serviceKey: string;
  service: RatingServiceInfo;
  disabled?: boolean;
}) {
  const numValue = value === "" ? null : Number(value);
  const filledColors = getNumericalFilledColors(service);
  const svc = service as {
    min_stars: number;
    max_stars: number;
    star_shape: StarShape;
  };

  return (
    <NumericalRatingControl
      value={numValue}
      minStars={svc.min_stars}
      maxStars={svc.max_stars}
      serviceKey={serviceKey}
      starShape={svc.star_shape}
      onChange={(v) => onChange(v === null ? "" : String(v))}
      disabled={disabled}
      size="compact"
      filledColors={filledColors}
    />
  );
}

/** Inc/Dec rating value: +/- control with editable middle field */
function IncDecValueEditor({
  value,
  onChange,
  service,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  service: RatingServiceInfo;
  disabled?: boolean;
}) {
  const numValue = value === "" ? 0 : Number(value);
  const theme = useActiveTheme();
  const incDecColors = getIncDecPositiveColors(service);
  const incDecOverlayColor = getThemeAdjustedColorFromHex(
    incDecColors?.brush,
    theme,
  );

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label={`Rating: ${numValue}`}
    >
      <Button
        variant="outline"
        size="default"
        className="size-9 p-0"
        onClick={() => onChange(String(Math.max(0, numValue - 1)))}
        disabled={disabled || numValue <= 0}
        aria-label="Decrease"
      >
        <IconMinus aria-hidden className="size-5" />
      </Button>
      <Input
        type="number"
        min={0}
        className={cn(
          "h-9 w-16 [appearance:textfield] rounded-lg text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          incDecOverlayColor &&
            "border-(--badge-overlay)/50 text-(--badge-overlay)",
        )}
        style={
          incDecOverlayColor
            ? ({ "--badge-overlay": incDecOverlayColor } as CSSProperties)
            : undefined
        }
        value={numValue}
        onChange={(e) => {
          const v = e.target.value === "" ? "0" : e.target.value;
          const n = Math.max(0, Number(v));
          onChange(String(Number.isNaN(n) ? 0 : n));
        }}
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="default"
        className="size-9 p-0"
        onClick={() => onChange(String(numValue + 1))}
        disabled={disabled}
        aria-label="Increase"
      >
        <IconPlus aria-hidden className="size-5" />
      </Button>
    </div>
  );
}

/** Tag value editor with autocomplete from the hydrus API */
function TagValueEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedInput, setDebouncedInput] = useState(value);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedInput(inputValue);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { data } = useSearchTagsQuery(
    debouncedInput.replace(/^-+/, "").replace(/:$/, ""),
  );
  const suggestions = data?.tags.slice(0, 50) ?? [];
  const isNegated = inputValue.trimStart().startsWith("-");
  const hasSufficientInput = inputValue.trim().replace(/^-+/, "").length >= 3;
  const showDropdown = open && hasSufficientInput && suggestions.length > 0;

  const namespaceColors = useNamespaceColors();
  const { namespace } = parseTag(inputValue);
  const inputColor = namespace
    ? (namespaceColors[namespace] ?? namespaceColors["null"])
    : undefined;

  const handleSelect = useCallback(
    (tag: string) => {
      const selected = isNegated ? `-${tag}` : tag;
      setInputValue(selected);
      onChange(selected);
      setOpen(false);
    },
    [onChange, isNegated],
  );

  return (
    <>
      <div className="relative w-full lg:w-auto lg:max-w-96 lg:min-w-48 lg:flex-1">
        <Input
          className="w-full"
          style={inputColor ? { color: inputColor } : undefined}
          value={inputValue}
          disabled={disabled}
          placeholder="type a tag…"
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
        />
        {showDropdown && (
          <div className="bg-popover border-border ring-foreground/5 absolute top-full left-0 z-50 mt-1 w-full min-w-64 overflow-hidden rounded-lg border shadow-md ring-1">
            <Command shouldFilter={false}>
              <CommandList>
                {suggestions.map((tag) => (
                  <TagSuggestionItem
                    key={tag.value}
                    value={tag.value}
                    negated={isNegated}
                    count={tag.count}
                    onSelect={() => handleSelect(tag.value)}
                  />
                ))}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="default"
        className="shrink-0"
        onClick={() => {
          const toggled = isNegated
            ? inputValue.replace(/^-/, "")
            : `-${inputValue}`;
          setInputValue(toggled);
          onChange(toggled);
        }}
        disabled={disabled}
        type="button"
      >
        <IconPlusMinus data-icon="inline-start" className="size-5" />
        {isNegated ? "Include" : "Exclude"}
      </Button>
    </>
  );
}

function TagSuggestionItem({
  value,
  negated,
  count,
  onSelect,
}: {
  value: string;
  negated?: boolean;
  count: number;
  onSelect: () => void;
}) {
  const namespaceColors = useNamespaceColors();
  const { namespace } = parseTag(value);
  const color = namespaceColors[namespace] ?? namespaceColors["null"];

  const style: CSSProperties | undefined = color ? { color } : undefined;

  return (
    <CommandItem value={value} onSelect={onSelect}>
      <span className="min-w-0 flex-1 truncate" style={style}>
        {negated ? "-" : ""}
        {value}
      </span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {count.toLocaleString()}
      </span>
    </CommandItem>
  );
}

// ---------------------------------------------------------------------------
// Combinator selector (AND/OR toggle)
// ---------------------------------------------------------------------------

function QBCombinatorSelect(props: VersatileSelectorProps) {
  const { level } = props;
  // Root level is always AND, sub-groups are always OR — no toggle needed.
  // Show a static label so the user sees the relationship.
  if (level === 0) {
    return (
      <span className="text-muted-foreground px-1 text-sm font-medium">
        and
      </span>
    );
  }
  return (
    <span className="text-muted-foreground px-1 text-sm font-medium">or</span>
  );
}

// ---------------------------------------------------------------------------
// Classnames for QueryBuilder layout
// ---------------------------------------------------------------------------

const controlClassnames = {
  queryBuilder: "",
  ruleGroup:
    "qb-group flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 [&_.qb-group]:ml-1 [&_.qb-group]:rounded-none [&_.qb-group]:border-0 [&_.qb-group]:border-l-4 [&_.qb-group]:border-l-primary",
  header: "order-last flex flex-wrap items-center gap-2",
  body: "flex flex-col gap-0",
  rule: "flex flex-wrap items-center gap-2",
  combinators: "",
  betweenRules: "my-2 md:my-1 self-center lg:self-start",
  dragHandle: "hidden",
  notToggle: "hidden",
  lock: "hidden",
  cloneGroup: "hidden",
  cloneRule: "hidden",
  shiftActions: "hidden",
  valueSource: "hidden",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const emptyQuery: RuleGroupType = {
  combinator: "and",
  rules: [{ field: "tag", operator: "=", value: "" }],
};

// Force sub-groups to always use OR combinator (only creates new objects when needed)
function enforceCombinators(query: RuleGroupType): RuleGroupType {
  // Remove empty sub-groups (no rules left)
  const filtered = query.rules.filter(
    (rule) => !("rules" in rule) || rule.rules.length > 0,
  );

  const needsFilter = filtered.length !== query.rules.length;
  const needsCombinatorFix =
    query.combinator !== "and" ||
    filtered.some((rule) => "rules" in rule && rule.combinator !== "or");

  if (!needsFilter && !needsCombinatorFix) {
    return query; // No changes needed — return same reference
  }

  return {
    ...query,
    combinator: "and",
    rules: filtered.map((rule) => {
      if ("rules" in rule && rule.combinator !== "or") {
        return { ...rule, combinator: "or" as const };
      }
      return rule;
    }),
  };
}

// Prevent nested groups beyond 1 level deep
const handleAddGroup = (_group: RuleGroupType, parentPath: Array<number>) => {
  // parentPath.length === 0 means root → allow; otherwise block
  return parentPath.length === 0;
};

// Set the default field based on the context passed from the action button.
// "Add tag" / default (incl. addRuleToNewGroups) → field: "tag"
// "Add system" passes { addSystem: true } → field: "status"
// "Add limit" passes { addLimit: true } → field: "limit"
const handleAddRule = (
  rule: RuleType,
  _parentPath: Array<number>,
  _query: RuleGroupType,
  context?: { addSystem?: boolean; addLimit?: boolean },
): RuleType => {
  if (context?.addLimit) {
    return { ...rule, field: "limit", operator: "=", value: 256 };
  }
  if (context?.addSystem) {
    return { ...rule, field: "inbox", operator: "is", value: "" };
  }
  return { ...rule, field: "tag", operator: "=", value: "" };
};

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
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

export type SortConfig = {
  sortType: HydrusFileSortType;
  sortAsc: boolean;
};

function SortSelect({
  value,
  onChange,
}: {
  value: HydrusFileSortType;
  onChange: (value: HydrusFileSortType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? "import time";

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const isSearching = search.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="border-input bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-50 sm:w-auto sm:max-w-96 sm:min-w-60"
        aria-label="Sort by"
      >
        <span className="truncate">{selectedLabel}</span>
        <IconChevronDown className="text-muted-foreground size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[70dvh] w-56 p-0"
        align="start"
        side="right"
        positionMethod="fixed"
        sideOffset={-240}
      >
        <Command
          shouldFilter={isSearching}
          filter={(itemValue, searchTerm, keywords) => {
            if (searchTerm.length < 3) {
              const haystack = [itemValue, ...(keywords ?? [])]
                .join(" ")
                .toLowerCase();
              return haystack.includes(searchTerm.toLowerCase()) ? 1 : 0;
            }
            const score = defaultFilter(itemValue, searchTerm, keywords);
            return score > 0.05 ? score : 0;
          }}
        >
          <CommandInput
            placeholder="Search sort…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-none">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {SORT_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  data-checked={value === opt.value}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface SearchQueryBuilderProps {
  initialQuery?: RuleGroupType;
  initialSort?: SortConfig;
  onSearch: (query: RuleGroupType, options?: { sort?: SortConfig }) => void;
}

export function SearchQueryBuilder({
  initialQuery,
  initialSort,
  onSearch,
}: SearchQueryBuilderProps) {
  const [query, setQuery] = useState<RuleGroupType>(initialQuery ?? emptyQuery);
  const [sortType, setSortType] = useState<HydrusFileSortType>(
    initialSort?.sortType ?? HydrusFileSortType.ImportTime,
  );
  const [sortAsc, setSortAsc] = useState(initialSort?.sortAsc ?? false);
  const canEditRatings = useHasPermission(Permission.EDIT_FILE_RATINGS);
  const { ratingServices } = useRatingServices();
  const { data: servicesData } = useGetServicesQuery();

  // Build file service options from API-discovered services
  const fileServiceValues = useMemo(() => {
    if (!servicesData) return [];
    return Object.values(servicesData.services)
      .filter((s) => FILE_SERVICE_TYPES.has(s.type))
      .map((s) => ({ name: s.name, label: s.name }));
  }, [servicesData]);

  // Build field groups with rating services when available
  const allFieldGroups = useMemo(() => {
    let groups = fieldGroups;

    // Inject file service values into the file_service field
    if (fileServiceValues.length > 0) {
      groups = groups.map((group) => ({
        ...group,
        options: group.options.map((field) =>
          field.name === "file_service"
            ? { ...field, values: fileServiceValues }
            : field,
        ),
      }));
    }

    if (canEditRatings && ratingServices.length > 0) {
      return [...groups, ...buildRatingFieldGroups(ratingServices)];
    }

    return groups;
  }, [canEditRatings, ratingServices, fileServiceValues]);

  const handleQueryChange = useCallback((q: RuleGroupType) => {
    setQuery(enforceCombinators(q));
  }, []);

  const hydrusSearch = useMemo(() => queryToHydrusSearch(query), [query]);
  const hasRules = query.rules.length > 0;

  // Check if query contains at least one non-negated tag rule.
  // Negated tags and system-only searches scan the full file set.
  const hasPositiveTagRule = useMemo(() => {
    const checkRules = (rules: RuleGroupType["rules"]): boolean =>
      rules.some((r) => {
        if ("rules" in r) return checkRules(r.rules);
        return (
          r.field === "tag" &&
          typeof r.value === "string" &&
          r.value.trim().length > 0 &&
          !r.value.trimStart().startsWith("-")
        );
      });
    return checkRules(query.rules);
  }, [query]);

  const isSystemOnly = hasRules && !hasPositiveTagRule;
  const allowSystemOnlySearch = useAllowSystemOnlySearch();
  const { setAllowSystemOnlySearch } = useSearchSettingsActions();

  const searchDisabled =
    hydrusSearch.length === 0 || (isSystemOnly && !allowSystemOnlySearch);

  const handleSearch = useCallback(() => {
    const sort: SortConfig = { sortType, sortAsc };
    onSearch(query, { sort });
  }, [query, onSearch, sortType, sortAsc]);

  const handleReset = useCallback(() => {
    setQuery(initialQuery ?? { ...emptyQuery, rules: [] });
  }, [initialQuery]);

  const handleClear = useCallback(() => {
    setQuery(emptyQuery);
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <QueryBuilder
        fields={allFieldGroups}
        query={query}
        onQueryChange={handleQueryChange}
        controlClassnames={controlClassnames}
        suppressStandardClassnames
        showCombinatorsBetweenRules
        addRuleToNewGroups
        parseNumbers
        onAddRule={handleAddRule}
        onAddGroup={handleAddGroup}
        controlElements={{
          fieldSelector: QBFieldSelect,
          operatorSelector: QBOperatorSelect,
          valueEditor: QBValueEditor,
          addRuleAction: QBActionElement,
          removeRuleAction: QBActionElement,
          addGroupAction: QBActionElement,
          removeGroupAction: QBActionElement,
          combinatorSelector: QBCombinatorSelect,
        }}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-muted-foreground shrink-0 text-sm font-medium">
          Sort by
        </span>
        <div className="flex items-center gap-2">
          <SortSelect value={sortType} onChange={setSortType} />
          <Button
            variant="ghost"
            size="default"
            onClick={() => setSortAsc((prev) => !prev)}
            type="button"
            aria-pressed={sortAsc}
            aria-label={sortAsc ? "Sort ascending" : "Sort descending"}
          >
            {sortAsc ? (
              <>
                <IconSortAscending2Filled className="size-6" />
                <span className="hidden text-sm sm:inline">ascending</span>
              </>
            ) : (
              <>
                <IconSortDescending2Filled className="size-6" />
                <span className="hidden text-sm sm:inline">descending</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {hydrusSearch.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">
            New search query
          </span>
          <div className="flex flex-wrap gap-1.5">
            {hydrusSearch.map((entry, i) =>
              Array.isArray(entry) ? (
                <OrTagBadge key={i} tags={entry} />
              ) : (
                <TagBadgeFromString key={i} displayTag={entry} />
              ),
            )}
          </div>
        </div>
      )}

      {hasRules && (
        <div className="flex flex-col gap-2">
          {isSystemOnly && (
            <div className="bg-warning/10 text-warning-foreground border-warning/30 flex flex-col gap-2 rounded-lg border p-3 text-sm">
              <span>
                This query will likely scan the full file set, which can be
                extremely slow and may hang hydrus on large databases. <br />
                Add a non-negated tag to narrow the search.
              </span>
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={allowSystemOnlySearch}
                  onCheckedChange={setAllowSystemOnlySearch}
                />
                <span>Allow system-only searches</span>
              </label>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="default"
              onClick={handleSearch}
              disabled={searchDisabled}
              type="button"
            >
              Search
            </Button>
            {initialQuery && initialQuery.rules.length > 0 && (
              <Button
                variant="ghost"
                size="default"
                onClick={handleReset}
                type="button"
              >
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="default"
              onClick={handleClear}
              type="button"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
