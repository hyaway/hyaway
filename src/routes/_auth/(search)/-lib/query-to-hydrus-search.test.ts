// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { queryToHydrusSearch, ruleToSearchTag } from "./query-to-hydrus-search";
import type { RuleGroupType, RuleType } from "react-querybuilder";

const makeRule = (
  field: string,
  operator: string,
  value: unknown,
): RuleType => ({ field, operator, value });

const makeQuery = (
  combinator: "and" | "or",
  rules: RuleGroupType["rules"],
): RuleGroupType => ({ combinator, rules });

describe("ruleToSearchTag", () => {
  it.each([
    [
      makeRule("tag", "=", "copyright: public domain"),
      "copyright: public domain",
    ],
    [makeRule("tag", "=", "  creator:somebody  "), "creator:somebody"],
    [makeRule("tag", "=", "series:"), "series:*"],
    [makeRule("tag", "=", "-series:"), "-series:*"],
    [makeRule("tag", "=", ""), null],
    [makeRule("tag", "=", "   "), null],
    [makeRule("tag", "=", "---"), null],
    [makeRule("tag", "=", "system:"), null],
    [makeRule("tag", "=", " system:* "), null],
    [makeRule("tag", "=", 123), null],
  ])("converts tag rule %#", (rule, expected) => {
    expect(ruleToSearchTag(rule)).toBe(expected);
  });

  it.each([
    [makeRule("inbox", "=", ""), "system:inbox"],
    [makeRule("archive", "=", ""), "system:archive"],
    [makeRule("everything", "=", ""), "system:everything"],
  ])("converts status field %#", (rule, expected) => {
    expect(ruleToSearchTag(rule)).toBe(expected);
  });

  it.each([
    ["audio", "system:has audio", "system:no audio"],
    ["transparency", "system:has transparency", "system:no transparency"],
    ["exif", "system:has exif", "system:no exif"],
    ["icc_profile", "system:has icc profile", "system:no icc profile"],
    [
      "embedded_metadata",
      "system:has embedded metadata",
      "system:no embedded metadata",
    ],
    [
      "forced_filetype",
      "system:has forced filetype",
      "system:no forced filetype",
    ],
    ["duration_presence", "system:has duration", "system:no duration"],
    ["framerate_presence", "system:has framerate", "system:no framerate"],
    ["frames_presence", "system:has frames", "system:no frames"],
    ["tags_presence", "system:has tags", "system:untagged"],
    ["urls_presence", "system:has urls", "system:no urls"],
    ["notes_presence", "system:has notes", "system:no notes"],
  ])("converts has-only field %s", (field, hasLabel, hasNotLabel) => {
    expect(ruleToSearchTag(makeRule(field, "has", ""))).toBe(hasLabel);
    expect(ruleToSearchTag(makeRule(field, "has_not", ""))).toBe(hasNotLabel);
  });

  it.each([
    [makeRule("rating:likes", "has", ""), "system:has rating for likes"],
    [makeRule("rating:likes", "has_not", ""), "system:no rating for likes"],
    [makeRule("rating:likes", "=", "liked"), "system:rating for likes = like"],
    [
      makeRule("rating:likes", "=", "disliked"),
      "system:rating for likes = dislike",
    ],
    [makeRule("rating:score", ">", 3), "system:rating for score > 3"],
    [makeRule("rating:score", "=", 0), "system:rating for score = 0"],
    [makeRule("rating:score", "=", ""), null],
    [makeRule("rating:score", "=", null), null],
  ])("converts rating rule %#", (rule, expected) => {
    expect(ruleToSearchTag(rule)).toBe(expected);
  });

  it.each([
    ["width", ">", 640, "system:width > 640"],
    ["height", "<", 480, "system:height < 480"],
    ["ratio", "=", "16:9", "system:ratio = 16:9"],
    ["num_pixels", ">", "1mp", "system:num pixels > 1mp"],
    ["filesize", "<", "10mb", "system:filesize < 10mb"],
    ["limit", "=", 50, "system:limit = 50"],
    ["filetype", "=", "image/jpeg", "system:filetype = image/jpeg"],
    ["num_tags", ">", 12, "system:number of tags > 12"],
    ["duration_value", ">", "5s", "system:duration > 5s"],
    ["framerate", ">", 24, "system:framerate > 24"],
    [
      "file_service",
      "is currently in",
      "my files",
      "system:file service is currently in my files",
    ],
    ["num_urls", ">", 0, "system:number of urls > 0"],
    ["num_notes", ">", 0, "system:number of notes > 0"],
    ["num_frames", ">", 1, "system:number of frames > 1"],
    ["import_time", "<", "7 days ago", "system:import time < 7 days ago"],
    ["modified_time", ">", "2024-01-01", "system:modified time > 2024-01-01"],
    ["archived_time", "<", "30 days ago", "system:archived time < 30 days ago"],
    [
      "last_viewed_time",
      ">",
      "1 day ago",
      "system:last viewed time > 1 day ago",
    ],
    ["hash", "=", "abc123", "system:hash = abc123"],
    ["media_views", ">", 10, "system:media views > 10"],
    ["preview_views", ">", 5, "system:preview views > 5"],
    ["all_views", ">", 15, "system:all views > 15"],
    ["media_viewtime", ">", "1 hour", "system:media viewtime > 1 hour"],
    [
      "preview_viewtime",
      ">",
      "10 minutes",
      "system:preview viewtime > 10 minutes",
    ],
    ["all_viewtime", ">", "2 hours", "system:all viewtime > 2 hours"],
  ])(
    "converts comparison/value field %s",
    (field, operator, value, expected) => {
      expect(ruleToSearchTag(makeRule(field, operator, value))).toBe(expected);
    },
  );

  it.each([
    [
      makeRule("url_exact", "has", "https://example.test/post/1"),
      "system:has url https://example.test/post/1",
    ],
    [
      makeRule("url_exact", "has_not", "https://example.test/post/1"),
      "system:does not have url https://example.test/post/1",
    ],
    [
      makeRule("url_regex", "has", "example\\.test"),
      "system:has url matching regex example\\.test",
    ],
    [
      makeRule("url_regex", "has_not", "example\\.test"),
      "system:does not have url matching regex example\\.test",
    ],
    [
      makeRule("url_domain", "has", "example.test"),
      "system:has url with domain example.test",
    ],
    [
      makeRule("url_domain", "has_not", "example.test"),
      "system:does not have url with domain example.test",
    ],
    [
      makeRule("note_name", "has", "translation"),
      'system:has note with name "translation"',
    ],
    [
      makeRule("note_name", "has_not", "translation"),
      'system:does not have note with name "translation"',
    ],
  ])("converts URL and note field %#", (rule, expected) => {
    expect(ruleToSearchTag(rule)).toBe(expected);
  });

  it.each([
    makeRule("unknown", "=", "value"),
    makeRule("width", "=", ""),
    makeRule("width", "=", null),
    makeRule("width", "=", undefined),
  ])("returns null for unsupported or empty value rule %#", (rule) => {
    expect(ruleToSearchTag(rule)).toBeNull();
  });
});

describe("queryToHydrusSearch", () => {
  it("returns an empty search for empty or fully ignored queries", () => {
    expect(queryToHydrusSearch(makeQuery("and", []))).toEqual([]);
    expect(
      queryToHydrusSearch(
        makeQuery("and", [
          makeRule("tag", "=", ""),
          makeRule("tag", "=", "system:"),
          makeRule("width", "=", null),
          makeQuery("or", [makeRule("tag", "=", "system:*")]),
        ]),
      ),
    ).toEqual([]);
  });

  it("converts top-level AND rules to separate Hydrus search entries", () => {
    expect(
      queryToHydrusSearch(
        makeQuery("and", [
          makeRule("tag", "=", "copyright: public domain"),
          makeRule("inbox", "=", ""),
          makeRule("width", ">", 640),
        ]),
      ),
    ).toEqual([
      "copyright: public domain",
      "system:inbox",
      "system:width > 640",
    ]);
  });

  it("converts nested OR groups to Hydrus OR arrays", () => {
    expect(
      queryToHydrusSearch(
        makeQuery("and", [
          makeRule("tag", "=", "creator:one"),
          makeQuery("or", [
            makeRule("tag", "=", "series:alpha"),
            makeRule("tag", "=", "series:beta"),
          ]),
          makeRule("height", "<", 480),
        ]),
      ),
    ).toEqual([
      "creator:one",
      ["series:alpha", "series:beta"],
      "system:height < 480",
    ]);
  });

  it("collapses single-entry nested OR groups to a plain search entry", () => {
    expect(
      queryToHydrusSearch(
        makeQuery("and", [
          makeRule("tag", "=", "creator:one"),
          makeQuery("or", [
            makeRule("tag", "=", ""),
            makeRule("tag", "=", "series:alpha"),
          ]),
        ]),
      ),
    ).toEqual(["creator:one", "series:alpha"]);
  });

  it("omits nested OR groups when all collected rules are ignored", () => {
    expect(
      queryToHydrusSearch(
        makeQuery("and", [
          makeRule("tag", "=", "creator:one"),
          makeQuery("or", [
            makeRule("tag", "=", ""),
            makeRule("tag", "=", "system:*"),
            makeRule("unknown", "=", "value"),
          ]),
          makeRule("archive", "=", ""),
        ]),
      ),
    ).toEqual(["creator:one", "system:archive"]);
  });

  it("fails when the root group is not AND", () => {
    expect(() =>
      queryToHydrusSearch(
        makeQuery("or", [
          makeRule("tag", "=", "series:alpha"),
          makeRule("archive", "=", ""),
        ]),
      ),
    ).toThrow("Search query root group must use AND combinator.");
  });

  it("fails when nested groups are not OR", () => {
    expect(() =>
      queryToHydrusSearch(
        makeQuery("and", [
          makeRule("tag", "=", "creator:one"),
          makeQuery("and", [
            makeRule("tag", "=", "series:alpha"),
            makeRule("width", ">", 640),
          ]),
        ]),
      ),
    ).toThrow("Search query nested groups must use OR combinator.");
  });

  it("fails when OR groups contain nested groups", () => {
    expect(() =>
      queryToHydrusSearch(
        makeQuery("and", [
          makeQuery("or", [
            makeRule("tag", "=", "series:alpha"),
            makeQuery("and", [
              makeRule("tag", "=", "creator:one"),
              makeRule("width", ">", 640),
            ]),
          ]),
        ]),
      ),
    ).toThrow("Search query OR groups cannot contain nested groups.");
  });

  it("ignores bare system namespace tag rules", () => {
    const query: RuleGroupType = {
      combinator: "and",
      rules: [
        { field: "tag", operator: "=", value: "system:" },
        { field: "tag", operator: "=", value: " system:* " },
        { field: "tag", operator: "=", value: "series:" },
      ],
    };

    expect(queryToHydrusSearch(query)).toEqual(["series:*"]);
  });
});
