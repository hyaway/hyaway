// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useMemo } from "react";
import type { CSSProperties } from "react";

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
 *
 * When a `stroke` color is provided in the style prop, renders a slightly larger
 * version underneath to create an outline effect (since mask-image doesn't support stroke).
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

  const hasStroke = style && "stroke" in style && style.stroke != null;
  const strokeColor = hasStroke
    ? (style as { stroke?: string }).stroke
    : undefined;

  // Extract style without stroke for the main icon
  const mainStyle: CSSProperties = useMemo(() => {
    if (!style) return {};

    const { stroke: _stroke, ...rest } = style as CSSProperties & {
      stroke?: string;
    };
    return rest;
  }, [style]);

  const baseClassName = cn("inline-block", !filled && "opacity-40");

  const maskStyle: CSSProperties = {
    backgroundColor: "currentColor",
    mask: `${maskUrl} center / contain no-repeat`,
    WebkitMask: `${maskUrl} center / contain no-repeat`,
  };

  // If stroke color is provided, render outline underneath
  if (hasStroke && filled) {
    return (
      <span className={cn("relative inline-block", className)}>
        {/* Outline layer - slightly larger, rendered underneath */}
        <span
          className={cn(baseClassName, "absolute inset-0 size-full")}
          style={{
            ...maskStyle,
            backgroundColor: strokeColor as string,
            transform: "scale(1.12)",
          }}
          aria-hidden="true"
        />
        {/* Main icon layer */}
        <span
          className={cn(baseClassName, "relative size-full")}
          style={{
            ...maskStyle,
            ...mainStyle,
          }}
          role="img"
          aria-hidden="true"
        />
      </span>
    );
  }

  // Simple case: no stroke outline needed
  return (
    <span
      className={cn(baseClassName, className)}
      style={{
        ...maskStyle,
        ...mainStyle,
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
