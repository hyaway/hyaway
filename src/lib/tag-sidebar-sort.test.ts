// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import {  sortTagItems } from "./tag-sidebar-sort";
import type {TagItem} from "./tag-sidebar-sort";

const items: Array<TagItem> = [
  { tag: "zebra", count: 1, namespace: "" },
  { tag: "apple", count: 3, namespace: "" },
  { tag: "mid", count: 1, namespace: "character" },
  { tag: "ace", count: 1, namespace: "character" },
];

const key = (i: TagItem) => `${i.namespace}:${i.tag}`;

test("count: count desc, then namespaced-first/name", () => {
  expect(sortTagItems(items, "count").map(key)).toEqual([
    ":apple",
    "character:ace",
    "character:mid",
    ":zebra",
  ]);
});

test("alpha: by tag name, namespace-agnostic", () => {
  expect(sortTagItems(items, "alpha").map((i) => i.tag)).toEqual([
    "ace",
    "apple",
    "mid",
    "zebra",
  ]);
});

test("namespace: grouped namespaced-first, then within group", () => {
  expect(sortTagItems(items, "namespace").map(key)).toEqual([
    "character:ace",
    "character:mid",
    ":apple",
    ":zebra",
  ]);
});

test("does not mutate input", () => {
  const copy = [...items];
  sortTagItems(items, "alpha");
  expect(items).toEqual(copy);
});
