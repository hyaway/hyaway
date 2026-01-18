// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
import {
  DEFAULT_PAGE_CARD_HORIZONTAL_GAP,
  DEFAULT_PAGE_CARD_VERTICAL_GAP,
  DEFAULT_PAGE_CARD_WIDTH,
  MIN_PAGE_CARD_WIDTH,
  PAGE_CARD_ASPECT_RATIO,
} from "@/stores/pages-settings-store";

export interface PageGridLanesConfig {
  cardWidth: number;
  horizontalGap: number;
  verticalGap: number;
  expandCards: boolean;
}

export interface PageGridLanesResult {
  lanes: number;
  /** Effective card width (may be expanded to fill space) */
  effectiveCardWidth: number;
  /** Effective card height based on aspect ratio */
  effectiveCardHeight: number;
  /** Horizontal gap between columns */
  horizontalGap: number;
  /** Vertical gap between rows */
  verticalGap: number;
}

/**
 * Hook to calculate the number of lanes for a pages grid item grid based on container width.
 * Supports configurable card size, gap, and expand-to-fill behavior.
 */
export function usePageGridLanes(
  containerRef: RefObject<HTMLElement | null>,
  minLanes: number,
  maxLanes: number,
  maxItems: number = Infinity,
  config: PageGridLanesConfig = {
    cardWidth: DEFAULT_PAGE_CARD_WIDTH,
    horizontalGap: DEFAULT_PAGE_CARD_HORIZONTAL_GAP,
    verticalGap: DEFAULT_PAGE_CARD_VERTICAL_GAP,
    expandCards: true,
  },
): PageGridLanesResult {
  const { cardWidth, horizontalGap, verticalGap, expandCards } = config;

  const [result, setResult] = useState<PageGridLanesResult>({
    lanes: 1,
    effectiveCardWidth: cardWidth,
    effectiveCardHeight: Math.round(cardWidth * PAGE_CARD_ASPECT_RATIO),
    horizontalGap,
    verticalGap,
  });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;

      // Calculate how many lanes can fit at the configured card width
      const fittingLanes = Math.floor(
        (containerWidth + horizontalGap) / (cardWidth + horizontalGap),
      );

      // Calculate how many lanes can fit at minimum card width (absolute max)
      const maxFittingLanes = Math.floor(
        (containerWidth + horizontalGap) /
          (MIN_PAGE_CARD_WIDTH + horizontalGap),
      );

      // Calculate final lanes - respect minLanes but don't exceed what can physically fit
      const calculatedLanes = Math.max(minLanes, fittingLanes);
      const lanes = Math.max(
        1,
        Math.min(calculatedLanes, maxLanes, maxItems, maxFittingLanes),
      );

      // Calculate effective card width
      let effectiveCardWidth = cardWidth;
      if (lanes > 0) {
        const usedWidth = lanes * cardWidth + (lanes - 1) * horizontalGap;

        if (expandCards) {
          // Expand cards to fill available space
          const extraSpace = containerWidth - usedWidth;
          const extraPerCard = Math.floor(extraSpace / lanes);
          effectiveCardWidth = cardWidth + extraPerCard;
        } else if (usedWidth > containerWidth) {
          // Shrink cards to fit when container is too small (but don't expand)
          // Clamp to minimum card width
          effectiveCardWidth = Math.max(
            MIN_PAGE_CARD_WIDTH,
            Math.floor((containerWidth - (lanes - 1) * horizontalGap) / lanes),
          );
        }
      }

      const effectiveCardHeight = Math.round(
        effectiveCardWidth * PAGE_CARD_ASPECT_RATIO,
      );

      setResult({
        lanes,
        effectiveCardWidth,
        effectiveCardHeight,
        horizontalGap,
        verticalGap,
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [
    containerRef,
    minLanes,
    maxLanes,
    maxItems,
    cardWidth,
    horizontalGap,
    verticalGap,
    expandCards,
  ]);

  return result;
}
