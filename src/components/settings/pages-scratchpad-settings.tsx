// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Field, FieldLabel } from "@/components/ui-primitives/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui-primitives/input-group";
import {
  usePagesSettingsActions,
  useScratchpadPageName,
} from "@/stores/pages-settings-store";

export function PagesScratchpadSettings() {
  const scratchpadPageName = useScratchpadPageName();
  const { setScratchpadPageName } = usePagesSettingsActions();

  return (
    <Field>
      <FieldLabel htmlFor="scratchpad-page-name-input">
        Scratchpad page
      </FieldLabel>
      <InputGroup>
        <InputGroupAddon>hyAway /</InputGroupAddon>
        <InputGroupInput
          id="scratchpad-page-name-input"
          value={scratchpadPageName}
          onChange={(event) => setScratchpadPageName(event.target.value)}
          placeholder="scratchpad"
          aria-label="Scratchpad page name"
        />
      </InputGroup>
      <div className="text-muted-foreground space-y-1 text-xs">
        <p>
          Scratchpad matches above Hydrus page by name and type, creates it if
          it does not exist.
        </p>
      </div>
    </Field>
  );
}
