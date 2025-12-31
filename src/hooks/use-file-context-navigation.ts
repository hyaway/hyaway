import { useEffect, useMemo } from "react";
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

  const { prevId, nextId, currentIndex } = useMemo(() => {
    if (!fileIds || fileIds.length === 0) {
      return { prevId: null, nextId: null, currentIndex: -1 };
    }

    const idx = fileIds.indexOf(fileId);
    if (idx === -1) {
      return { prevId: null, nextId: null, currentIndex: -1 };
    }

    return {
      prevId: idx > 0 ? fileIds[idx - 1] : null,
      nextId: idx < fileIds.length - 1 ? fileIds[idx + 1] : null,
      currentIndex: idx,
    };
  }, [fileId, fileIds]);

  // Determine if we should fallback to /file/$fileId
  const shouldFallback = useMemo(() => {
    // Don't fallback while still loading
    if (isLoading) return false;
    // Fallback on error
    if (isError) return true;
    // Fallback if file not in list
    if (fileIds && currentIndex === -1) return true;
    return false;
  }, [isLoading, isError, fileIds, currentIndex]);

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

  const navActions: Array<FloatingFooterAction> = useMemo(() => {
    const actions: Array<FloatingFooterAction> = [];

    actions.push({
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
    });

    actions.push({
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
    });

    return actions;
  }, [prevId, nextId, navigate, contextRoute, buildParams]);

  return {
    navActions,
    shouldFallback,
    currentPosition: currentIndex >= 0 ? currentIndex + 1 : null,
    totalCount: fileIds?.length ?? 0,
  };
}
