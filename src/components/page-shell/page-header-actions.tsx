// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { HeaderActionsPortal } from "../app-shell/header-actions-portal";
import type { ReactNode } from "react";

interface PageHeaderActionsProps {
  /** Content to render in the header actions area */
  children: ReactNode;
}

/**
 * Portal content to the app header's actions slot.
 * Use this to add page-specific settings popovers or other actions to the header.
 */
export function PageHeaderActions({ children }: PageHeaderActionsProps) {
  return <HeaderActionsPortal>{children}</HeaderActionsPortal>;
}
