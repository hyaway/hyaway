// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MediaPage } from "@/integrations/hydrus-api/models";
import { setupCrossTabSync } from "@/lib/cross-tab-sync";

const SLUG_SUFFIX_LENGTH = 9;

export interface LatestOpenedPageRef {
  pageKey: string;
  pageSlug: string;
  pageName: string;
  openedAt: number;
}

type LatestOpenedPageInput = Omit<LatestOpenedPageRef, "openedAt">;

type LatestOpenedPageState = {
  latestPage: LatestOpenedPageRef | null;
  actions: {
    setLatestOpenedPage: (page: LatestOpenedPageInput) => void;
  };
};

function extractNameSlug(slug: string): string | null {
  if (slug.length <= SLUG_SUFFIX_LENGTH) return null;
  return slug.slice(0, -SLUG_SUFFIX_LENGTH);
}

function resolveLatestOpenedPage(
  latestPage: LatestOpenedPageRef | null,
  pages: Array<MediaPage>,
): MediaPage | null {
  if (!latestPage) {
    return null;
  }

  const exactKeyMatch = pages.find(
    (page) => page.page_key === latestPage.pageKey,
  );
  if (exactKeyMatch) {
    return exactKeyMatch;
  }

  const exactSlugMatch = pages.find(
    (page) => page.slug === latestPage.pageSlug,
  );
  if (exactSlugMatch) {
    return exactSlugMatch;
  }

  const latestNameSlug = extractNameSlug(latestPage.pageSlug);
  if (latestNameSlug) {
    const nameSlugMatch = pages.find(
      (page) => extractNameSlug(page.slug) === latestNameSlug,
    );
    if (nameSlugMatch) {
      return nameSlugMatch;
    }
  }

  return pages.find((page) => page.name === latestPage.pageName) ?? null;
}

const useLatestOpenedPageStore = create<LatestOpenedPageState>()(
  persist(
    (set) => ({
      latestPage: null,
      actions: {
        setLatestOpenedPage: (page) =>
          set({ latestPage: { ...page, openedAt: Date.now() } }),
      },
    }),
    {
      name: "hyaway-latest-opened-page",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ actions, ...rest }) => rest,
    },
  ),
);

setupCrossTabSync(useLatestOpenedPageStore);

export const useLatestOpenedPageMatch = (pages: Array<MediaPage>) =>
  useLatestOpenedPageStore((state) =>
    resolveLatestOpenedPage(state.latestPage, pages),
  );

export const useLatestOpenedPageActions = () =>
  useLatestOpenedPageStore((state) => state.actions);
