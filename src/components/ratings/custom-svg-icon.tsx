// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useMemo } from "react";

import type { IconComponent, ShapeIcons } from "./shape-icons";
import { cn } from "@/lib/utils";

/**
 * Props for CustomSvgIcon
 */
interface CustomSvgIconProps {
  /** Raw SVG string from Hydrus API */
  svgContent: string;
  /** Whether to render as filled or outline (lower opacity) */
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders an SVG as an icon using CSS mask-image.
 * This approach avoids parsing the SVG and allows it to inherit currentColor.
 */
export const CustomSvgIcon = memo(function CustomSvgIcon({
  svgContent,
  filled = false,
  className,
  style,
}: CustomSvgIconProps) {
  const maskUrl = useMemo(
    () => `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`,
    [svgContent],
  );

  return (
    <span
      className={cn("inline-block size-6", className)}
      style={{
        backgroundColor: "currentColor",
        mask: `${maskUrl} center / contain no-repeat`,
        WebkitMask: `${maskUrl} center / contain no-repeat`,
        opacity: filled ? 1 : 0.4,
        ...style,
      }}
      role="img"
      aria-hidden="true"
    />
  );
});

/**
 * Creates icon components from custom SVG content.
 * Returns a ShapeIcons-compatible object with filled and outline variants.
 */
export function createCustomSvgIcons(svgContent: string): ShapeIcons {
  const FilledIcon: IconComponent = ({ className }) => (
    <CustomSvgIcon svgContent={svgContent} filled className={className} />
  );
  const OutlineIcon: IconComponent = ({ className }) => (
    <CustomSvgIcon
      svgContent={svgContent}
      filled={false}
      className={className}
    />
  );

  return {
    filled: FilledIcon,
    outline: OutlineIcon,
  };
}
