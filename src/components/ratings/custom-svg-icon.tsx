// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useMemo } from "react";

import type { IconComponent, ShapeIcons } from "./shape-icons";
import { cn } from "@/lib/utils";

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
 * SVG colors are normalized to currentColor so the icon inherits the CSS color property.
 */
export const CustomSvgIcon = memo(function CustomSvgIcon({
  svgContent,
  filled = false,
  className,
  style,
}: CustomSvgIconProps) {
  // Normalize SVG colors to currentColor and create mask URL
  const maskUrl = useMemo(() => {
    return `url("data:image/svg+xml,${encodeURIComponent(svgContent)}")`;
  }, [svgContent]);

  return (
    <span
      className={cn("inline-block", !filled && "opacity-40", className)}
      style={{
        backgroundColor: "currentColor",
        mask: `${maskUrl} center / contain no-repeat`,
        WebkitMask: `${maskUrl} center / contain no-repeat`,
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
  const FilledIcon: IconComponent = ({ className, style }) => (
    <CustomSvgIcon
      svgContent={svgContent}
      filled
      className={className}
      style={style}
    />
  );
  const OutlineIcon: IconComponent = ({ className, style }) => (
    <CustomSvgIcon
      svgContent={svgContent}
      filled={false}
      className={className}
      style={style}
    />
  );

  return {
    filled: FilledIcon,
    outline: OutlineIcon,
  };
}
