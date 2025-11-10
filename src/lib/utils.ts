import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}
// Simple hash for key (no crypto needed for cache key)
export const simpleHash = (str: string) =>
  [...str].reduce((a, b) => a + b.charCodeAt(0), 0);
