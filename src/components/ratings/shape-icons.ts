// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import {
  IconCarambola,
  IconCarambolaFilled,
  IconCaretLeftFilled,
  IconCaretRightFilled,
  IconCircle,
  IconCircleFilled,
  IconDiamonds,
  IconDiamondsFilled,
  IconDroplet,
  IconDropletFilled,
  IconEscalator,
  IconEscalatorFilled,
  IconHeart,
  IconHeartFilled,
  IconHelpCircle,
  IconHelpCircleFilled,
  IconHexagon,
  IconHexagonFilled,
  IconHourglass,
  IconHourglassFilled,
  IconJewishStar,
  IconJewishStarFilled,
  IconMoon,
  IconMoonFilled,
  IconPentagon,
  IconPentagonFilled,
  IconPlus,
  IconRosette,
  IconRosetteFilled,
  IconSquare,
  IconSquareFilled,
  IconStar,
  IconStarFilled,
  IconTriangle,
  IconTriangleFilled,
  IconTriangleInverted,
  IconTriangleInvertedFilled,
  IconX,
} from "@tabler/icons-react";
import type { CSSProperties, ComponentType } from "react";

import type { StarShape } from "@/integrations/hydrus-api/models";

export type IconComponent = ComponentType<{
  className?: string;
  style?: CSSProperties;
}>;

export interface ShapeIcons {
  filled: IconComponent;
  outline: IconComponent;
  /** Additional className for icon styling (e.g., stroke-width, transforms) */
  className?: string;
}

/**
 * Default shape when star_shape is not specified or unknown.
 */
export const DEFAULT_SHAPE: ShapeIcons = {
  filled: IconHelpCircleFilled,
  outline: IconHelpCircle,
};

/**
 * Maps Hydrus star_shape values to Tabler icon components.
 * Hydrus shapes: https://hydrusnetwork.github.io/hydrus/developer_api.html#get_services
 */
export const SHAPE_ICONS: Record<StarShape, ShapeIcons> = {
  circle: {
    filled: IconCircleFilled,
    outline: IconCircle,
  },
  square: {
    filled: IconSquareFilled,
    outline: IconSquare,
  },
  "fat star": {
    filled: IconCarambolaFilled,
    outline: IconCarambola,
  },
  "pentagram star": {
    filled: IconStarFilled,
    outline: IconStar,
  },
  "six point star": {
    filled: IconJewishStarFilled,
    outline: IconJewishStar,
  },
  "eight point star": {
    filled: IconRosetteFilled,
    outline: IconRosette,
  },
  "x shape": {
    filled: IconX,
    outline: IconX,
  },
  "square cross": {
    filled: IconPlus,
    outline: IconPlus,
  },
  "triangle up": {
    filled: IconTriangleFilled,
    outline: IconTriangle,
  },
  "triangle down": {
    filled: IconTriangleInvertedFilled,
    outline: IconTriangleInverted,
  },
  "triangle right": {
    filled: IconCaretRightFilled,
    outline: IconCaretRightFilled,
  },
  "triangle left": {
    filled: IconCaretLeftFilled,
    outline: IconCaretLeftFilled,
  },
  diamond: {
    filled: IconDiamondsFilled,
    outline: IconDiamonds,
  },
  "rhombus right": {
    filled: IconEscalatorFilled,
    outline: IconEscalator,
  },
  "rhombus left": {
    filled: IconEscalatorFilled,
    outline: IconEscalator,
    className: "-scale-x-100",
  },
  hourglass: {
    filled: IconHourglassFilled,
    outline: IconHourglass,
  },
  pentagon: {
    filled: IconPentagonFilled,
    outline: IconPentagon,
  },
  hexagon: {
    filled: IconHexagonFilled,
    outline: IconHexagon,
  },
  "small hexagon": {
    filled: IconHexagonFilled,
    outline: IconHexagon,
    className: "scale-75",
  },
  heart: { filled: IconHeartFilled, outline: IconHeart },
  teardrop: {
    filled: IconDropletFilled,
    outline: IconDroplet,
  },
  "crescent moon": {
    filled: IconMoonFilled,
    outline: IconMoon,
  },
  // Custom SVG uses default shape as fallback (actual SVG fetched separately)
  svg: DEFAULT_SHAPE,
  // Virtual shape for inc/dec services (not from Hydrus)
  incDecServiceIcon: {
    filled: IconSquareFilled,
    outline: IconSquareFilled,
  },
};

/**
 * Gets the shape icons for a given star_shape value.
 * Returns DEFAULT_SHAPE if the shape is not specified.
 */
export function getShapeIcons(starShape?: StarShape): ShapeIcons {
  return starShape ? SHAPE_ICONS[starShape] : DEFAULT_SHAPE;
}
