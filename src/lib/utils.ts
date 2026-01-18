// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ClassValue } from "clsx";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}
