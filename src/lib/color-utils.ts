/**
 * Color utilities for contrast adjustment and accessibility.
 * Uses APCA (Advanced Perceptual Contrast Algorithm) for contrast calculations.
 */

type RGB = [number, number, number];

// Background colors matching --background CSS variable
// Light: oklch(1 0 0) = rgb(255, 255, 255)
// Dark: oklch(0.145 0 0) = rgb(10, 10, 10)
const LIGHT_BG: RGB = [255, 255, 255];
const DARK_BG: RGB = [10, 10, 10];

// Badge background opacity (20% of tag color over base background)
const BADGE_BG_OPACITY = 0.2;

// APCA minimum contrast (Lc) for body text
// Lc 60 is recommended for body text, 45 for large/bold text
const MIN_APCA_CONTRAST = 60;

// APCA constants
const APCA_NORM_BG = 0.56;
const APCA_NORM_TXT = 0.57;
const APCA_REV_BG = 0.65;
const APCA_REV_TXT = 0.62;
const APCA_SCALE = 1.14;
const APCA_CLAMP = 0.1;
const APCA_LO_OFFSET = 0.027;
const APCA_LO_CLIP = 0.1;

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
 * Convert sRGB value (0-255) to APCA Y (luminance).
 * Uses piecewise sRGB transfer function with APCA coefficients.
 */
function srgbToY(rgb: RGB): number {
  // Linearize with piecewise sRGB transfer
  const coeffs = [0.2126729, 0.7151522, 0.072175];

  let Y = 0;
  for (let i = 0; i < 3; i++) {
    const c = rgb[i] / 255;
    // Piecewise linearization
    const lin = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    Y += lin * coeffs[i];
  }

  // Soft clamp for very dark colors
  return Y > 0.022 ? Y : Y + Math.pow(0.022 - Y, 1.414);
}

/**
 * Calculate APCA contrast (Lc) between text and background.
 * Returns a signed value: positive means dark text on light bg,
 * negative means light text on dark bg.
 * Target: |Lc| >= 60 for body text, >= 45 for large text.
 */
function getApcaContrast(textRgb: RGB, bgRgb: RGB): number {
  const Ytxt = srgbToY(textRgb);
  const Ybg = srgbToY(bgRgb);

  // Determine polarity and calculate contrast
  let Lc: number;

  if (Ybg > Ytxt) {
    // Dark text on light background (normal polarity)
    const SAPC =
      (Math.pow(Ybg, APCA_NORM_BG) - Math.pow(Ytxt, APCA_NORM_TXT)) *
      APCA_SCALE;
    Lc =
      SAPC < APCA_CLAMP
        ? 0
        : SAPC < APCA_LO_CLIP
          ? SAPC - SAPC * APCA_LO_OFFSET
          : SAPC - APCA_LO_OFFSET;
  } else {
    // Light text on dark background (reverse polarity)
    const SAPC =
      (Math.pow(Ybg, APCA_REV_BG) - Math.pow(Ytxt, APCA_REV_TXT)) * APCA_SCALE;
    Lc =
      SAPC > -APCA_CLAMP
        ? 0
        : SAPC > -APCA_LO_CLIP
          ? SAPC - SAPC * APCA_LO_OFFSET
          : SAPC + APCA_LO_OFFSET;
  }

  return Lc * 100;
}

/**
 * Convert RGB to linear RGB.
 */
function rgbToLinear(rgb: RGB): [number, number, number] {
  return rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
}

/**
 * Convert linear RGB to RGB.
 */
function linearToRgb(linear: [number, number, number]): RGB {
  return linear.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, v)) * 255);
  }) as RGB;
}

/**
 * Convert RGB to OKLCH.
 */
function rgbToOklch(rgb: RGB): [number, number, number] {
  const [r, g, b] = rgbToLinear(rgb);

  // Linear RGB to LMS
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // LMS to Lab (cube root)
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // Lab
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // Lab to LCH
  const C = Math.sqrt(a * a + bVal * bVal);
  const H = Math.atan2(bVal, a) * (180 / Math.PI);

  return [L, C, H < 0 ? H + 360 : H];
}

/**
 * Convert OKLCH to RGB.
 */
function oklchToRgb(L: number, C: number, H: number): RGB {
  // LCH to Lab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // Lab to LMS (cube)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to linear RGB
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return linearToRgb([r, g, bl]);
}

/**
 * Adjust a color's lightness to meet APCA contrast requirements.
 * Preserves hue and chroma while adjusting lightness using OKLCH color space.
 * Accounts for the badge background being 20% of the text color over the base background.
 * Adjusts chroma to compensate for lightness changes - boosts for light theme, reduces for dark.
 */
function adjustColorForContrast(color: RGB, baseBackground: RGB): RGB {
  // Calculate effective background: base background with 20% of the color overlaid
  const effectiveBackground = blendColors(
    color,
    baseBackground,
    BADGE_BG_OPACITY,
  );
  const contrast = Math.abs(getApcaContrast(color, effectiveBackground));

  if (contrast >= MIN_APCA_CONTRAST) {
    return color;
  }

  const [L, C, H] = rgbToOklch(color);
  const bgY = srgbToY(baseBackground);
  const isDarkBg = bgY < 0.2; // APCA uses different threshold than WCAG

  // Binary search for the right lightness
  let minL = isDarkBg ? L : 0;
  let maxL = isDarkBg ? 1 : L;

  // If on dark bg, we need to go lighter; if on light bg, we need to go darker
  for (let i = 0; i < 20; i++) {
    const midL = (minL + maxL) / 2;
    const testColor = oklchToRgb(midL, C, H);
    // Recalculate effective background for this test color
    const testEffectiveBg = blendColors(
      testColor,
      baseBackground,
      BADGE_BG_OPACITY,
    );
    const testContrast = Math.abs(getApcaContrast(testColor, testEffectiveBg));

    if (testContrast >= MIN_APCA_CONTRAST) {
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

  // Adjust chroma based on lightness change
  const lightnessShift = Math.abs(finalL - L);
  let adjustedC = C;

  if (isDarkBg) {
    // Dark theme: reduce chroma slightly when going lighter to avoid oversaturation
    adjustedC = C * Math.max(0.7, 1 - lightnessShift * 0.3);
  } else {
    // Light theme: boost chroma when going darker to maintain vibrancy
    // Also apply a base boost since darker colors appear less saturated
    adjustedC = C * Math.min(1.5, 1 + lightnessShift * 0.8);
  }

  return oklchToRgb(finalL, adjustedC, H);
}

/**
 * Adjust an RGB color for accessible contrast based on theme.
 * Returns an RGB tuple adjusted for the background in the given theme.
 * Uses APCA contrast algorithm for better perceptual accuracy.
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
