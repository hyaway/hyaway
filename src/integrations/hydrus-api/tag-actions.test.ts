// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  TAG_ACTION_ADD,
  TAG_ACTION_DELETE,
  buildAddTagsBody,
  planTagActions,
  resolveTagServiceKey,
  selectLocalTagServices,
  tagIsCurrentOnFile,
  tagsToRemoveOnUndo,
} from "./tag-actions";
import { ServiceType, TagStatus } from "./models";
import type { FileMetadata, ServiceInfo } from "./models";

const tagsField: FileMetadata["tags"] = {
  svc: { display_tags: { [TagStatus.CURRENT]: ["existing", "blue"] } },
};

describe("buildAddTagsBody", () => {
  it("builds an add body (action 0)", () => {
    expect(
      buildAddTagsBody({
        file_ids: [1],
        service_key: "svc",
        tags: ["a", "b"],
        action: TAG_ACTION_ADD,
      }),
    ).toEqual({
      file_ids: [1],
      service_keys_to_actions_to_tags: { svc: { "0": ["a", "b"] } },
    });
  });

  it("builds a delete body (action 1)", () => {
    expect(
      buildAddTagsBody({
        file_ids: [2],
        service_key: "svc",
        tags: ["x"],
        action: TAG_ACTION_DELETE,
      }),
    ).toEqual({
      file_ids: [2],
      service_keys_to_actions_to_tags: { svc: { "1": ["x"] } },
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
  it("dedupes, trims, drops empties, and records presence", () => {
    const result = planTagActions(
      [{ tag: "new" }, { tag: " new " }, { tag: "existing" }, { tag: "  " }],
      "svc",
      tagsField,
    );
    expect(result.tags).toEqual(["new", "existing"]);
    expect(result.restore).toEqual([
      { serviceKey: "svc", tag: "new", wasPresent: false },
      { serviceKey: "svc", tag: "existing", wasPresent: true },
    ]);
  });
});

describe("tagsToRemoveOnUndo", () => {
  it("returns only tags that were not already present", () => {
    expect(
      tagsToRemoveOnUndo([
        { serviceKey: "svc", tag: "new", wasPresent: false },
        { serviceKey: "svc", tag: "existing", wasPresent: true },
      ]),
    ).toEqual(["new"]);
  });
});
