// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  formatNamespaceSortValue,
  parseNamespaceSortValue,
} from "./search-defaults";

describe("namespace sort value helpers", () => {
  it("parses Hydrus-style dash separated namespaces", () => {
    expect(
      parseNamespaceSortValue("series-creator-title-volume-chapter-page"),
    ).toEqual(["series", "creator", "title", "volume", "chapter", "page"]);
  });

  it("treats escaped dashes as part of the namespace", () => {
    expect(parseNamespaceSortValue("creator\\-id-series-page")).toEqual([
      "creator-id",
      "series",
      "page",
    ]);
  });

  it("formats namespaces with escaped dashes", () => {
    expect(formatNamespaceSortValue(["creator-id", "series", "page"])).toBe(
      "creator\\-id-series-page",
    );
  });

  it("drops empty and invalid namespace values", () => {
    expect(parseNamespaceSortValue(" Series --bad:value- -Page ")).toEqual([
      "series",
      "page",
    ]);
  });

  it("strips Hydrus-style undesired characters without regex control ranges", () => {
    expect(parseNamespaceSortValue("ser\u0000ies-\u200bcreator")).toEqual([
      "series",
      "creator",
    ]);
  });
});
