// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Field, FieldLabel } from "@/components/ui-primitives/field";
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui-primitives/input-group";
import { Toggle } from "@/components/ui-primitives/toggle";
import {
  usePagesSettingsActions,
  useScratchpadPageLocation,
  useScratchpadPageName,
} from "@/stores/pages-settings-store";

export function PagesScratchpadSettings() {
  const scratchpadPageLocation = useScratchpadPageLocation();
  const scratchpadPageName = useScratchpadPageName();
  const { setScratchpadPageLocation, setScratchpadPageName } =
    usePagesSettingsActions();

  return (
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
          {scratchpadPageLocation === "root" ? "(top page)" : "hyAway"}
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
          Scratchpad matches the selected Hydrus location by name and type, then
          creates the file search page if it does not exist.
        </p>
      </div>
    </Field>
  );
}
