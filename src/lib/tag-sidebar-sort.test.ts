// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { sortTagItems } from "./tag-sidebar-sort";
import type { TagItem } from "./tag-sidebar-types";

const items: Array<TagItem> = [
  { tag: "zebra", count: 1, namespace: "" },
  { tag: "apple", count: 3, namespace: "" },
  { tag: "mid", count: 1, namespace: "character" },
  { tag: "ace", count: 1, namespace: "character" },
  { tag: "late", count: 5, namespace: "character" },
];

const mixedNamespaces: Array<TagItem> = [
  { tag: "plain-low", count: 1, namespace: "" },
  { tag: "beta", count: 2, namespace: "series" },
  { tag: "gamma", count: 4, namespace: "creator" },
  { tag: "alpha", count: 4, namespace: "creator" },
  { tag: "delta", count: 1, namespace: "series" },
  { tag: "plain-high", count: 5, namespace: "" },
  { tag: "aardvark", count: 5, namespace: "" },
];

const combineTag = (i: TagItem) =>
  i.namespace ? `${i.namespace}:${i.tag}` : i.tag;

test("count: count desc, then namespaced-first/name", () => {
  expect(sortTagItems(items, "count").map(combineTag)).toEqual([
    "character:late",
    "apple",
    "character:ace",
    "character:mid",
    "zebra",
  ]);
});

test("api: preserves incoming order", () => {
  expect(sortTagItems(items, "api").map(combineTag)).toEqual([
    "zebra",
    "apple",
    "character:mid",
    "character:ace",
    "character:late",
  ]);
});

test("namespace: namespace order, then count desc within namespace", () => {
  expect(sortTagItems(items, "namespace").map(combineTag)).toEqual([
    "character:late",
    "character:ace",
    "character:mid",
    "apple",
    "zebra",
  ]);
});

test("namespace: namespaced groups first, namespace alpha, count desc within each group", () => {
  expect(sortTagItems(mixedNamespaces, "namespace").map(combineTag)).toEqual([
    "creator:alpha",
    "creator:gamma",
    "series:beta",
    "series:delta",
    "aardvark",
    "plain-high",
    "plain-low",
  ]);
});

test("count: equal counts fall back to compareTags", () => {
  expect(sortTagItems(mixedNamespaces, "count").map(combineTag)).toEqual([
    "aardvark",
    "plain-high",
    "creator:alpha",
    "creator:gamma",
    "series:beta",
    "series:delta",
    "plain-low",
  ]);
});

test.each(["count", "namespace", "api"] as const)(
  "%s: returns a new array without mutating input",
  (mode) => {
    const copy = [...items];
    const result = sortTagItems(items, mode);

    expect(result).not.toBe(items);
    expect(items).toEqual(copy);
  },
);

test("api: returned copy preserves object identity and order", () => {
  const result = sortTagItems(items, "api");

  expect(result).toEqual(items);
  expect(result).not.toBe(items);
  expect(result[0]).toBe(items[0]);
});
