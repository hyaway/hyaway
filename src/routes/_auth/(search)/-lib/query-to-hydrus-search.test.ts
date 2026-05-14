// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { queryToHydrusSearch } from "./query-to-hydrus-search";
import type { RuleGroupType } from "react-querybuilder";

describe("queryToHydrusSearch", () => {
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
