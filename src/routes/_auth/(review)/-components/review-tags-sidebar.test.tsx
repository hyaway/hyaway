// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { ReviewTagsSidebar } from "./review-tags-sidebar";

// theme-store calls window.matchMedia at initialisation; stub the module to avoid jsdom errors.
vi.mock("@/stores/theme-store", () => ({
  useThemeStore: () => ({ activeTheme: "light" }),
  useActiveTheme: () => "light",
}));

// useIsMobile calls matchMedia at render time; jsdom doesn't support it.
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

// No current card → wrapper renders nothing.
vi.mock("@/stores/review-queue-store", () => ({
  useReviewQueueCurrentFileId: () => undefined,
}));

vi.mock("@/integrations/hydrus-api/queries/services", () => ({
  useAllKnownTagsServiceQuery: () => ({ data: "all" }),
}));

vi.mock("@/integrations/hydrus-api/queries/manage-files", () => ({
  useGetSingleFileMetadata: () => ({ data: undefined }),
}));

test("renders nothing when there is no current review card", () => {
  const qc = new QueryClient();
  const { container } = render(
    <QueryClientProvider client={qc}>
      <ReviewTagsSidebar />
    </QueryClientProvider>,
  );
  expect(container.firstChild).toBeNull();
});
