// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import type { CSSProperties } from "react";

import { getThemeAdjustedColorFromHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/stores/theme-store";

const SELECTED_TAG_BADGE_OVERLAY_HEX = "#6468f0";

export const SELECTED_TAG_BADGE_CLASSNAME = cn(
  "shadow-[inset_0_0_0_2px_var(--badge-overlay)]",
);

export const SELECTED_TAG_BADGE_TRIGGER_CLASSNAME = cn(
  "focus-visible:[&>span]:[box-shadow:inset_0_0_0_2px_var(--selected-tag-focus)]! focus-visible:[&>span]:[--badge-overlay:var(--selected-tag-overlay)]!",
  "data-popup-open:[&>span]:shadow-[inset_0_0_0_2px_var(--badge-overlay)] data-popup-open:[&>span]:[--badge-overlay:var(--selected-tag-overlay)]!",
  "focus-visible:[&>div>span:last-child]:[box-shadow:inset_0_0_0_2px_var(--selected-tag-focus)]! focus-visible:[&>div>span:last-child]:[--badge-overlay:var(--selected-tag-overlay)]!",
  "data-popup-open:[&>div>span:last-child]:shadow-[inset_0_0_0_2px_var(--badge-overlay)] data-popup-open:[&>div>span:last-child]:[--badge-overlay:var(--selected-tag-overlay)]!",
);

export const INTERACTIVE_TAG_BADGE_TRIGGER_CLASSNAME = cn(
  "relative cursor-pointer rounded-4xl outline-none select-none **:select-none focus-visible:z-10 data-popup-open:z-10",
  SELECTED_TAG_BADGE_TRIGGER_CLASSNAME,
);

export function useSelectedTagBadgeStyle(
  cssVariable = "--badge-overlay",
): CSSProperties {
  const theme = useActiveTheme();

  return useMemo(
    () => ({
      [cssVariable]: getThemeAdjustedColorFromHex(
        SELECTED_TAG_BADGE_OVERLAY_HEX,
        theme,
      ),
      "--selected-tag-focus": theme === "light" ? "black" : "white",
    }),
    [cssVariable, theme],
  );
}
