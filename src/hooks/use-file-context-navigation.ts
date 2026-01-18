// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { FloatingFooterAction } from "@/components/page-shell/page-floating-footer";

export interface FileContextNavigationOptions {
  /** The current file ID being viewed */
  fileId: number;
  /** The list of file IDs in the current context (gallery/page) */
  fileIds: Array<number> | undefined;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Whether there was an error loading the context */
  isError: boolean;
  /** Route path for navigating to a file in this context, e.g., "/recently-trashed/$fileId" */
  contextRoute: string;
  /** Function to build route params for a given fileId */
  buildParams: (fileId: number) => Record<string, string>;
}

export interface FileContextNavigationResult {
  /** Actions for prev/next navigation to add to footer */
  navActions: Array<FloatingFooterAction>;
  /** Whether we should redirect to the fallback route */
  shouldFallback: boolean;
  /** Current position in the list (1-indexed) */
  currentPosition: number | null;
  /** Total count of files in context */
  totalCount: number;
}

/**
 * Hook to manage prev/next navigation within a gallery/page context.
 *
 * When the context can't be loaded or the file isn't in the list,
 * it signals that the route should redirect to /file/$fileId.
 */
export function useFileContextNavigation({
  fileId,
  fileIds,
  isLoading,
  isError,
  contextRoute,
  buildParams,
}: FileContextNavigationOptions): FileContextNavigationResult {
  const navigate = useNavigate();

  const currentIndex = fileIds?.indexOf(fileId) ?? -1;
  const prevId = currentIndex > 0 ? fileIds![currentIndex - 1] : null;
  const nextId =
    fileIds && currentIndex >= 0 && currentIndex < fileIds.length - 1
      ? fileIds[currentIndex + 1]
      : null;

  // Determine if we should fallback to /file/$fileId
  const shouldFallback = isLoading
    ? false
    : isError
      ? true
      : fileIds && currentIndex === -1
        ? true
        : false;

  // Perform the fallback redirect
  useEffect(() => {
    if (shouldFallback) {
      navigate({
        to: "/file/$fileId",
        params: { fileId: String(fileId) },
        replace: true,
      });
    }
  }, [shouldFallback, fileId, navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const tagName = target?.tagName;
      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      ) {
        return;
      }

      if (event.key === "[" || event.key === "{") {
        if (prevId === null) return;
        event.preventDefault();
        navigate({
          to: contextRoute,
          params: buildParams(prevId),
        });
        return;
      }

      if (event.key === "]" || event.key === "}") {
        if (nextId === null) return;
        event.preventDefault();
        navigate({
          to: contextRoute,
          params: buildParams(nextId),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [buildParams, contextRoute, navigate, nextId, prevId]);

  const navActions: Array<FloatingFooterAction> = [
    {
      id: "nav-prev",
      label: "Previous",
      icon: IconChevronLeft,
      onClick: () => {
        if (prevId !== null) {
          navigate({
            to: contextRoute,
            params: buildParams(prevId),
          });
        }
      },
      disabled: prevId === null,
    },
    {
      id: "nav-next",
      label: "Next",
      icon: IconChevronRight,
      onClick: () => {
        if (nextId !== null) {
          navigate({
            to: contextRoute,
            params: buildParams(nextId),
          });
        }
      },
      disabled: nextId === null,
    },
  ];

  return {
    navActions,
    shouldFallback,
    currentPosition: currentIndex >= 0 ? currentIndex + 1 : null,
    totalCount: fileIds?.length ?? 0,
  };
}
