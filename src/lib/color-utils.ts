/**
 * Color utilities for contrast adjustment and accessibility.
 */

type RGB = [number, number, number];

// Background colors for high contrast badge variant
// Pure white for light theme, pure black for dark theme
const LIGHT_BG: RGB = [255, 255, 255];
const DARK_BG: RGB = [0, 0, 0];

// Badge background opacity (10% of tag color over base background)
const BADGE_BG_OPACITY = 0.2;

// WCAG AA minimum contrast ratio for normal text
const MIN_CONTRAST_RATIO = 4.5;

/**
 * Blend a foreground color with a background at a given opacity.
 * Simulates placing the foreground color at the given alpha over the background.
 */
function blendColors(fg: RGB, bg: RGB, alpha: number): RGB {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
  ];
}

/**
 * Convert sRGB value (0-255) to linear RGB.
 */
function srgbToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance of an RGB color.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(rgb: RGB): number {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors.
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert RGB to HSL.
 */
function rgbToHsl(rgb: RGB): [number, number, number] {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return [h, s, l];
}

/**
 * Convert HSL to RGB.
 */
function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Adjust a color's lightness to meet contrast requirements against a background.
 * Preserves hue and saturation while adjusting lightness.
 * Accounts for the badge background being 5% of the text color over the base background.
 */
function adjustColorForContrast(color: RGB, baseBackground: RGB): RGB {
  // Calculate effective background: base background with 5% of the color overlaid
  const effectiveBackground = blendColors(
    color,
    baseBackground,
    BADGE_BG_OPACITY,
  );
  const contrast = getContrastRatio(color, effectiveBackground);

  if (contrast >= MIN_CONTRAST_RATIO) {
    return color;
  }

  const [h, s, l] = rgbToHsl(color);
  const bgLuminance = getRelativeLuminance(baseBackground);
  const isDarkBg = bgLuminance < 0.5;

  // Binary search for the right lightness
  let minL = isDarkBg ? l : 0;
  let maxL = isDarkBg ? 1 : l;

  // If on dark bg, we need to go lighter; if on light bg, we need to go darker
  for (let i = 0; i < 20; i++) {
    const midL = (minL + maxL) / 2;
    const testColor = hslToRgb(h, s, midL);
    // Recalculate effective background for this test color
    const testEffectiveBg = blendColors(
      testColor,
      baseBackground,
      BADGE_BG_OPACITY,
    );
    const testContrast = getContrastRatio(testColor, testEffectiveBg);

    if (testContrast >= MIN_CONTRAST_RATIO) {
      if (isDarkBg) {
        maxL = midL; // Try to find a darker valid color (closer to original)
      } else {
        minL = midL; // Try to find a lighter valid color (closer to original)
      }
    } else {
      if (isDarkBg) {
        minL = midL; // Need to go lighter
      } else {
        maxL = midL; // Need to go darker
      }
    }
  }

  const finalL = isDarkBg ? minL : maxL;
  return hslToRgb(h, s, finalL);
}

/**
 * Adjust an RGB color for accessible contrast based on theme.
 * Returns an RGB tuple adjusted for the background in the given theme.
 */
export function adjustColorForTheme(rgb: RGB, theme: "light" | "dark"): RGB {
  const background = theme === "dark" ? DARK_BG : LIGHT_BG;
  return adjustColorForContrast(rgb, background);
}

/**
 * Convert RGB tuple to CSS rgb() string.
 */
export function rgbToString(rgb: RGB): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
