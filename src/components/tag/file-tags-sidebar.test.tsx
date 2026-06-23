// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { FileTagsSidebar } from "./file-tags-sidebar";
import type { ReactNode } from "react";

// theme-store calls window.matchMedia at initialisation; stub the module to avoid jsdom errors.
vi.mock("@/stores/theme-store", () => ({
  useThemeStore: () => ({ activeTheme: "light" }),
  useActiveTheme: () => "light",
}));

// useIsMobile calls matchMedia at render time; jsdom doesn't support it.
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

vi.mock("@/components/app-shell/right-sidebar-portal", () => ({
  RightSidebarPortal: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/components/tag/tags-sidebar", () => ({
  TagsSidebar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/integrations/hydrus-api/queries/services", () => ({
  useAllKnownTagsServiceQuery: () => ({ data: "all" }),
}));

const { useGetSingleFileMetadata } = vi.hoisted(() => ({
  useGetSingleFileMetadata: vi.fn(() => ({ data: undefined })),
}));

vi.mock("@/integrations/hydrus-api/queries/manage-files", () => ({
  useGetSingleFileMetadata,
}));

test("loads metadata for the provided file id", () => {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <FileTagsSidebar fileId={123} />
    </QueryClientProvider>,
  );
  expect(useGetSingleFileMetadata).toHaveBeenCalledWith(123);
});
