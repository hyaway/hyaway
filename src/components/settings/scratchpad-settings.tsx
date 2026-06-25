// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { SwitchField } from "@/components/settings/setting-fields";
import { Field, FieldLabel } from "@/components/ui-primitives/field";
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui-primitives/input-group";
import { Toggle } from "@/components/ui-primitives/toggle";
import {
  useScratchpadHideSentFiles,
  useScratchpadPageLocation,
  useScratchpadPageName,
  useScratchpadSettingsActions,
} from "@/stores/scratchpad-settings-store";

export const SCRATCHPAD_SETTINGS_TITLE = "Scratchpad";

export function ScratchpadSettings() {
  const scratchpadHideSentFiles = useScratchpadHideSentFiles();
  const scratchpadPageLocation = useScratchpadPageLocation();
  const scratchpadPageName = useScratchpadPageName();
  const {
    setScratchpadHideSentFiles,
    setScratchpadPageLocation,
    setScratchpadPageName,
  } = useScratchpadSettingsActions();

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="scratchpad-page-name-input">
          Scratchpad page
        </FieldLabel>
        <div className="flex items-center gap-2">
          <Toggle
            pressed={scratchpadPageLocation === "hyaway"}
            onPressedChange={(pressed) =>
              setScratchpadPageLocation(pressed ? "hyaway" : "root")
            }
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-label="Scratchpad page location"
          >
            {scratchpadPageLocation === "root"
              ? "(top page notebook)"
              : "hyAway"}
          </Toggle>
          <span className="text-muted-foreground text-sm">/</span>
          <InputGroup>
            <InputGroupInput
              id="scratchpad-page-name-input"
              value={scratchpadPageName}
              onChange={(event) => setScratchpadPageName(event.target.value)}
              placeholder="scratchpad"
              aria-label="Scratchpad page name"
            />
          </InputGroup>
        </div>
        <div className="text-muted-foreground space-y-1 text-xs">
          <p>
            Scratchpad matches the selected Hydrus location by name and type,
            then creates the file search page if it does not exist.
          </p>
        </div>
      </Field>
      <SwitchField
        id="scratchpad-hide-sent-files-switch"
        label="Hide files sent to scratchpad"
        description="Remove files from the current hyAway view after they are added."
        checked={scratchpadHideSentFiles}
        onCheckedChange={setScratchpadHideSentFiles}
      />
    </div>
  );
}
