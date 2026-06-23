// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { FileTagsSortToggle } from "@/components/settings/file-tags-settings";

export function FileTagsSidebarSortControls() {
  return (
    <FileTagsSortToggle
      variant="outline-muted"
      size="sm"
      className="w-full"
      itemClassName="flex-1"
    />
  );
}
