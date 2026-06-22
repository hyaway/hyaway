// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { expect, test, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { TagsSidebar } from "./tags-sidebar";
import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { TagStatus } from "@/integrations/hydrus-api/models";

// theme-store calls window.matchMedia at initialisation; stub the module to avoid jsdom errors.
vi.mock("@/stores/theme-store", () => ({
  useThemeStore: () => ({ activeTheme: "light" }),
  useActiveTheme: () => "light",
}));

// useIsMobile calls matchMedia at render time; jsdom doesn't support it.
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

// TagsSidebar resolves the "all tags" service id via this query.
vi.mock("@/integrations/hydrus-api/queries/services", () => ({
  useAllKnownTagsServiceQuery: () => ({ data: "all" }),
}));

const meta = {
  tags: {
    all: {
      display_tags: {
        [TagStatus.CURRENT]: ["zebra", "apple", "character:mid"],
      },
    },
  },
} as unknown as FileMetadata;

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test("review config: custom title + alpha/namespace sort options", () => {
  renderWithClient(
    <TagsSidebar
      items={[meta]}
      title="Current file"
      showIndex={false}
      sort={{
        mode: "alpha",
        onChange: () => {},
        options: [
          { value: "alpha", label: "Alpha" },
          { value: "namespace", label: "Namespace" },
        ],
      }}
    />,
  );
  expect(screen.getByText("Current file")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Alpha" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Namespace" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Count" })).toBeNull();
});

test("defaults: title 'Tags' and Count/Namespace options", () => {
  renderWithClient(<TagsSidebar items={[meta]} />);
  expect(screen.getByText("Tags")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Count" })).toBeTruthy();
});
