// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconDeviceFloppy,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import {
  useActiveReviewConfigId,
  useActiveReviewConfigName,
  useReviewConfigDirty,
  useReviewSettingsActions,
  useSavedReviewConfigs,
} from "@/stores/review-settings-store";
import { Button } from "@/components/ui-primitives/button";
import { Input } from "@/components/ui-primitives/input";
import { Label } from "@/components/ui-primitives/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui-primitives/dialog";
import { cn } from "@/lib/utils";

type DialogState =
  | { kind: "name"; mode: "saveAs" | "rename"; id?: string; value: string }
  | { kind: "delete"; id: string; name: string }
  // pendingId: the config to load after discarding, or null to start a new one
  | { kind: "discard"; pendingId: string | null }
  | null;

export function ReviewConfigBar() {
  const configs = useSavedReviewConfigs();
  const activeId = useActiveReviewConfigId();
  const activeName = useActiveReviewConfigName();
  const dirty = useReviewConfigDirty();
  const {
    saveConfigAs,
    overwriteActiveConfig,
    loadConfig,
    newConfig,
    renameConfig,
    deleteConfig,
  } = useReviewSettingsActions();

  const [dialog, setDialog] = useState<DialogState>(null);
  const close = () => setDialog(null);

  const selectConfig = (id: string) => {
    if (id === activeId) return;
    if (dirty) {
      setDialog({ kind: "discard", pendingId: id });
    } else {
      loadConfig(id);
    }
  };

  const startNewConfig = () => {
    if (dirty) {
      setDialog({ kind: "discard", pendingId: null });
    } else {
      newConfig();
    }
  };

  const submitName = () => {
    if (dialog?.kind !== "name") return;
    const value = dialog.value.trim();
    if (!value) return;
    if (dialog.mode === "saveAs") {
      saveConfigAs(value);
    } else if (dialog.id) {
      renameConfig(dialog.id, value);
    }
    close();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="text-muted-foreground text-xs">Config</Label>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button
              {...props}
              variant="outline"
              size="sm"
              className="min-w-48 justify-between"
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {activeName ?? "Unsaved configuration"}
                {dirty && (
                  <span className="text-muted-foreground"> • edited</span>
                )}
              </span>
              <IconChevronDown className="size-4 shrink-0" />
            </Button>
          )}
        />
        <DropdownMenuContent
          align="start"
          className="max-h-[50dvh] w-56 overflow-y-auto"
        >
          {configs.length === 0 ? (
            <DropdownMenuItem disabled>No saved configs</DropdownMenuItem>
          ) : (
            configs.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => selectConfig(c.id)}>
                <IconCheck
                  className={cn(
                    "size-4 shrink-0",
                    c.id === activeId ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={startNewConfig}
      >
        <IconPlus className="size-4" />
        New
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={!activeId || !dirty}
        onClick={overwriteActiveConfig}
      >
        <IconDeviceFloppy className="size-4" />
        Save
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          setDialog({ kind: "name", mode: "saveAs", value: activeName ?? "" })
        }
      >
        <IconCopy className="size-4" />
        Save as…
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={!activeId}
        onClick={() =>
          activeId &&
          setDialog({
            kind: "name",
            mode: "rename",
            id: activeId,
            value: activeName ?? "",
          })
        }
      >
        <IconPencil className="size-4" />
        Rename
      </Button>

      <Button
        variant="destructive"
        size="sm"
        disabled={!activeId}
        onClick={() =>
          activeId &&
          activeName &&
          setDialog({ kind: "delete", id: activeId, name: activeName })
        }
      >
        <IconTrash className="size-4" />
        Delete
      </Button>

      {/* Name dialog — Save as / Rename */}
      <Dialog
        open={dialog?.kind === "name"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "name" && dialog.mode === "saveAs"
                ? "Save config as"
                : "Rename config"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="review-config-name">Name</Label>
            <Input
              id="review-config-name"
              autoFocus
              value={dialog?.kind === "name" ? dialog.value : ""}
              onChange={(e) =>
                setDialog((d) =>
                  d?.kind === "name" ? { ...d, value: e.target.value } : d,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submitName();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={submitName}
              disabled={dialog?.kind !== "name" || !dialog.value.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={dialog?.kind === "delete"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete config?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === "delete"
                ? `"${dialog.name}" will be removed. Your current swipe actions stay as they are.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (dialog?.kind === "delete") deleteConfig(dialog.id);
                close();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard-on-dirty confirm */}
      <Dialog
        open={dialog?.kind === "discard"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              {activeName
                ? `You have unsaved edits to "${activeName}" that will be discarded.`
                : "Your unsaved edits will be discarded."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (dialog?.kind === "discard") {
                  if (dialog.pendingId) {
                    loadConfig(dialog.pendingId);
                  } else {
                    newConfig();
                  }
                }
                close();
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
