/**
 * Icon Generator Script
 *
 * Converts icon-source.svg to all required PNG sizes for PWA/app icons.
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires: sharp-cli globally installed
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, "..", "public");

// Source files
const faviconSvg = join(publicDir, "favicon-dark.svg"); // Bordered dark style (non-maskable)
const maskableSvg = join(publicDir, "maskable-icon-source.svg"); // Gradient style (maskable)
const shortcutPagesSvg = join(publicDir, "shortcut-pages.svg");
const shortcutRandomSvg = join(publicDir, "shortcut-random.svg");
const shortcutReviewSvg = join(publicDir, "shortcut-review.svg");

// Icon configurations
const icons = [
  // Non-maskable icons (use bordered favicon-dark.svg)
  { name: "logo192.png", size: 192, source: faviconSvg },
  { name: "logo512.png", size: 512, source: faviconSvg },

  // Maskable icons (use gradient maskable-icon-source.svg)
  { name: "logo192-maskable.png", size: 192, source: maskableSvg },
  { name: "logo512-maskable.png", size: 512, source: maskableSvg },

  // Apple touch icon (iOS applies mask, use gradient)
  { name: "apple-touch-icon.png", size: 180, source: maskableSvg },

  // Shortcut icons (Tabler icons, white on transparent)
  { name: "shortcut-pages.png", size: 96, source: shortcutPagesSvg },
  { name: "shortcut-random.png", size: 96, source: shortcutRandomSvg },
  { name: "shortcut-review.png", size: 96, source: shortcutReviewSvg },
];

console.log("🎨 Generating icons...\n");

for (const icon of icons) {
  const output = join(publicDir, icon.name);
  execSync(
    `sharp -i "${icon.source}" -o "${output}" resize ${icon.size} ${icon.size}`,
  );
  const sourceLabel = icon.source.includes("favicon.svg")
    ? "bordered"
    : "gradient";
  console.log(`✅ ${icon.name} (${icon.size}x${icon.size}) [${sourceLabel}]`);
}

console.log("\n🎉 All icons generated successfully!");
