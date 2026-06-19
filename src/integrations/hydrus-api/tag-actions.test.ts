// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  buildAddTagsBody,
  planTagActions,
  planTagUndo,
  resolveTagServiceKey,
  selectLocalTagServices,
  tagIsCurrentOnFile,
} from "./tag-actions";
import { ServiceType, TagStatus } from "./models";
import type { FileMetadata, ServiceInfo } from "./models";

const tagsField: FileMetadata["tags"] = {
  svc: { display_tags: { [TagStatus.CURRENT]: ["existing", "blue"] } },
};

describe("buildAddTagsBody", () => {
  it("builds an add-only body (action 0)", () => {
    expect(
      buildAddTagsBody({ file_ids: [1], service_key: "svc", add: ["a", "b"] }),
    ).toEqual({
      file_ids: [1],
      service_keys_to_actions_to_tags: { svc: { "0": ["a", "b"] } },
    });
  });

  it("builds a remove-only body (action 1)", () => {
    expect(
      buildAddTagsBody({ file_ids: [2], service_key: "svc", remove: ["x"] }),
    ).toEqual({
      file_ids: [2],
      service_keys_to_actions_to_tags: { svc: { "1": ["x"] } },
    });
  });

  it("combines add and remove in one body", () => {
    expect(
      buildAddTagsBody({
        file_ids: [3],
        service_key: "svc",
        add: ["a"],
        remove: ["x"],
      }),
    ).toEqual({
      file_ids: [3],
      service_keys_to_actions_to_tags: { svc: { "0": ["a"], "1": ["x"] } },
    });
  });

  it("omits empty action lists", () => {
    expect(
      buildAddTagsBody({ file_ids: [4], service_key: "svc", add: [], remove: [] }),
    ).toEqual({
      file_ids: [4],
      service_keys_to_actions_to_tags: { svc: {} },
    });
  });
});

describe("selectLocalTagServices", () => {
  it("keeps only LOCAL_TAG_DOMAIN services", () => {
    const services: Record<string, ServiceInfo> = {
      mytags: { type: ServiceType.LOCAL_TAG_DOMAIN, name: "my tags" } as ServiceInfo,
      ptr: { type: ServiceType.TAG_REPOSITORY, name: "PTR" } as ServiceInfo,
      files: { type: ServiceType.LOCAL_FILE_DOMAIN, name: "my files" } as ServiceInfo,
    };
    expect(selectLocalTagServices(services).map(([k]) => k)).toEqual(["mytags"]);
  });

  it("returns [] for undefined", () => {
    expect(selectLocalTagServices(undefined)).toEqual([]);
  });
});

describe("resolveTagServiceKey", () => {
  const one: Array<[string, ServiceInfo]> = [["a", {} as ServiceInfo]];
  const many: Array<[string, ServiceInfo]> = [
    ["a", {} as ServiceInfo],
    ["b", {} as ServiceInfo],
  ];
  it("returns null when none", () => {
    expect(resolveTagServiceKey([], "a")).toBeNull();
  });
  it("returns the sole service regardless of configured key", () => {
    expect(resolveTagServiceKey(one, null)).toBe("a");
    expect(resolveTagServiceKey(one, "ignored")).toBe("a");
  });
  it("returns the configured key when valid among many", () => {
    expect(resolveTagServiceKey(many, "b")).toBe("b");
  });
  it("returns null when configured key is missing/invalid among many", () => {
    expect(resolveTagServiceKey(many, null)).toBeNull();
    expect(resolveTagServiceKey(many, "zzz")).toBeNull();
  });
});

describe("tagIsCurrentOnFile", () => {
  it("true when present, false when absent/missing/undefined", () => {
    expect(tagIsCurrentOnFile(tagsField, "svc", "existing")).toBe(true);
    expect(tagIsCurrentOnFile(tagsField, "svc", "dog")).toBe(false);
    expect(tagIsCurrentOnFile(tagsField, "other", "existing")).toBe(false);
    expect(tagIsCurrentOnFile(undefined, "svc", "existing")).toBe(false);
  });
});

describe("planTagActions", () => {
  it("dedupes/trims both sides and records op + presence", () => {
    const result = planTagActions(
      [{ tag: "new" }, { tag: " new " }, { tag: "existing" }, { tag: "  " }],
      [{ tag: "blue" }, { tag: "gone" }],
      "svc",
      tagsField,
    );
    expect(result.add).toEqual(["new", "existing"]);
    expect(result.remove).toEqual(["blue", "gone"]);
    expect(result.restore).toEqual([
      { serviceKey: "svc", tag: "new", op: "add", wasPresent: false },
      { serviceKey: "svc", tag: "existing", op: "add", wasPresent: true },
      { serviceKey: "svc", tag: "blue", op: "remove", wasPresent: true },
      { serviceKey: "svc", tag: "gone", op: "remove", wasPresent: false },
    ]);
  });

  it("lets add win when a tag is on both sides", () => {
    const result = planTagActions(
      [{ tag: "both" }],
      [{ tag: "both" }],
      "svc",
      tagsField,
    );
    expect(result.add).toEqual(["both"]);
    expect(result.remove).toEqual([]);
  });
});

describe("planTagUndo", () => {
  it("re-adds removed-present tags and deletes added-absent tags", () => {
    expect(
      planTagUndo([
        { serviceKey: "svc", tag: "added", op: "add", wasPresent: false },
        { serviceKey: "svc", tag: "already", op: "add", wasPresent: true },
        { serviceKey: "svc", tag: "removed", op: "remove", wasPresent: true },
        { serviceKey: "svc", tag: "absent", op: "remove", wasPresent: false },
      ]),
    ).toEqual({ add: ["removed"], remove: ["added"] });
  });
});
