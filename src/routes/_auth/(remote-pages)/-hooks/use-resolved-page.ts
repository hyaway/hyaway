// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { MediaPage } from "@/integrations/hydrus-api/models";
import {
  resolvePageKeyFromParam,
  useGetMediaPagesQuery,
} from "@/integrations/hydrus-api/queries/manage-pages";

type ResolvedPageState =
  | { status: "loading" }
  | { status: "not-found"; pageId: string }
  | { status: "resolved"; page: MediaPage };

interface UseResolvedPageOptions {
  /** The pageId param from the URL (slug or page_key) */
  pageId: string;
  /** Additional params to preserve when redirecting (e.g., { fileId: "123" }) */
  redirectParams?: Record<string, string>;
  /** Route to redirect to. Defaults to "/pages/$pageId" */
  redirectTo?: string;
}

/**
 * Resolves a pageId URL param to a MediaPage, handling:
 * - Loading state while fetching pages
 * - Exact slug/page_key matches
 * - Fallback matches (same name, different ID) with automatic redirect
 * - Not found state
 */
export function useResolvedPage({
  pageId,
  redirectParams = {},
  redirectTo = "/pages/$pageId",
}: UseResolvedPageOptions): ResolvedPageState {
  const navigate = useNavigate();

  // Fetch all pages to resolve slug → page_key
  const { data: mediaPages, isPending: isPagesPending } =
    useGetMediaPagesQuery();

  // Resolve the pageId param to actual page data
  const resolution = mediaPages.length
    ? resolvePageKeyFromParam(pageId, mediaPages)
    : null;

  // Redirect to correct slug if we matched via fallback (e.g., Hydrus restarted)
  useEffect(() => {
    if (resolution?.needsRedirect) {
      void navigate({
        to: redirectTo,
        params: { pageId: resolution.page.slug, ...redirectParams },
        replace: true,
      });
    }
  }, [resolution, navigate, redirectTo, redirectParams]);

  // Loading state
  if (isPagesPending || resolution?.needsRedirect) {
    return { status: "loading" };
  }

  // Not found
  if (!resolution) {
    return { status: "not-found", pageId };
  }

  // Successfully resolved
  return { status: "resolved", page: resolution.page };
}
