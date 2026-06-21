// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  addConfigEntry,
  configsEqual,
  overwriteConfigEntry,
  removeConfigEntry,
  renameConfigEntry,
  sortedConfigs,
  uniqueConfigName,
} from "./review-config-utils";
import type { SavedReviewConfig } from "./review-config-utils";
import type { SwipeBindings } from "./review-settings-store";

const bindings: SwipeBindings = {
  left: { fileAction: "trash" },
  right: { fileAction: "archive" },
  up: { fileAction: "skip" },
  down: { fileAction: "undo" },
};
const snap = { bindings, tagServiceKey: "svc" };

function cfg(id: string, name: string): SavedReviewConfig {
  return { id, name, bindings, tagServiceKey: "svc" };
}

describe("configsEqual", () => {
  it("true for identical snapshots", () => {
    expect(configsEqual(snap, { bindings, tagServiceKey: "svc" })).toBe(true);
  });
  it("false when tag service differs", () => {
    expect(configsEqual(snap, { bindings, tagServiceKey: "other" })).toBe(false);
  });
  it("false when bindings differ", () => {
    const changed: SwipeBindings = { ...bindings, up: { fileAction: "archive" } };
    expect(configsEqual(snap, { bindings: changed, tagServiceKey: "svc" })).toBe(false);
  });
});

describe("uniqueConfigName", () => {
  it("returns the name when free", () => {
    expect(uniqueConfigName("Triage", ["Other"])).toBe("Triage");
  });
  it("appends a number on collision, incrementing", () => {
    expect(uniqueConfigName("Triage", ["Triage"])).toBe("Triage 2");
    expect(uniqueConfigName("Triage", ["Triage", "Triage 2"])).toBe("Triage 3");
  });
  it("falls back to 'Config' for blank input", () => {
    expect(uniqueConfigName("   ", [])).toBe("Config");
  });
});

describe("CRUD reducers", () => {
  it("addConfigEntry inserts with a uniquified name", () => {
    const next = addConfigEntry({}, "id1", "Triage", snap);
    expect(next.id1).toEqual({ id: "id1", name: "Triage", bindings, tagServiceKey: "svc" });
    const next2 = addConfigEntry(next, "id2", "Triage", snap);
    expect(next2.id2.name).toBe("Triage 2");
  });

  it("overwriteConfigEntry keeps id+name, updates snapshot", () => {
    const configs = { id1: cfg("id1", "Triage") };
    const next = overwriteConfigEntry(configs, "id1", { bindings, tagServiceKey: "changed" });
    expect(next.id1).toEqual({ id: "id1", name: "Triage", bindings, tagServiceKey: "changed" });
    expect(overwriteConfigEntry(configs, "missing", snap)).toBe(configs);
  });

  it("renameConfigEntry uniquifies vs others; rename-to-self doesn't bump", () => {
    const configs = { a: cfg("a", "One"), b: cfg("b", "Two") };
    expect(renameConfigEntry(configs, "a", "Two").a.name).toBe("Two 2");
    expect(renameConfigEntry(configs, "a", "One").a.name).toBe("One");
  });

  it("removeConfigEntry removes; missing is unchanged", () => {
    const configs = { a: cfg("a", "One"), b: cfg("b", "Two") };
    expect(Object.keys(removeConfigEntry(configs, "a"))).toEqual(["b"]);
    expect(removeConfigEntry(configs, "missing")).toBe(configs);
  });

  it("sortedConfigs is name-sorted", () => {
    const configs = { a: cfg("a", "Zebra"), b: cfg("b", "Alpha") };
    expect(sortedConfigs(configs).map((c) => c.name)).toEqual(["Alpha", "Zebra"]);
  });
});
