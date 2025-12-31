import { cn } from "./utils";

/** Checkerboard background pattern to indicate image transparency */
export const checkerboardBg = cn(
  "bg-[repeating-conic-gradient(#d4d4d4_0%_25%,#fff_0%_50%)] bg-size-[20px_20px] dark:bg-[repeating-conic-gradient(#404040_0%_25%,#262626_0%_50%)]",
);
