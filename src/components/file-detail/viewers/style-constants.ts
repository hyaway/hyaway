import { cn } from "@/lib/utils";

/** Base height calculation for file viewers (accounts for header, footer, and padding) */
const viewerHeightBase =
  "short:[--viewer-height:calc(100svh-var(--header-height-short)-var(--footer-height-short)-1rem)] [--viewer-height:calc(100svh-var(--header-height)-var(--footer-height)-2rem)]";

/** Fixed height constraint for file viewers */
export const viewerFixedHeight = cn(
  viewerHeightBase,
  "short:h-(--viewer-height) h-(--viewer-height)",
);

/** Minimum height constraint for file viewers (allows content to expand beyond) */
export const viewerMinHeight = cn(
  viewerHeightBase,
  "short:min-h-(--viewer-height) min-h-(--viewer-height)",
);

/** Maximum height constraint for file viewers (content shrinks to fit) */
export const viewerMaxHeight = cn(
  viewerHeightBase,
  "short:max-h-(--viewer-height) max-h-(--viewer-height)",
);
