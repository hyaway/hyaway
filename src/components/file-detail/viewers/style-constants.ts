import { cn } from "@/lib/utils";

/** Base height calculation for file viewers (accounts for header, footer, and padding) */
const viewerHeightBase =
  "short:[--viewer-height:calc(100svh-var(--header-height-short)-var(--footer-height-short)-1rem)] [--viewer-height:calc(100svh-var(--header-height)-var(--footer-height)-1.25rem)]";

/** Fixed height constraint for file viewers */
export const viewerFixedHeight = cn(viewerHeightBase, "h-(--viewer-height)");

/** Minimum height constraint for file viewers (allows content to expand beyond) */
export const viewerMinHeight = cn(viewerHeightBase, "min-h-(--viewer-height)");

/** Maximum height constraint for file viewers (content shrinks to fit) */
export const viewerMaxHeight = cn(viewerHeightBase, "max-h-(--viewer-height)");
