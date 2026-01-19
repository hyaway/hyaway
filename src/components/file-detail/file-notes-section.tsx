// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import { IconChevronDown, IconNote } from "@tabler/icons-react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { Heading } from "@/components/ui-primitives/heading";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui-primitives/collapsible";
import { cn } from "@/lib/utils";

interface FileNotesSectionProps {
  data: FileMetadata;
}

export function FileNotesSection({ data }: FileNotesSectionProps) {
  const notes = useMemo(() => {
    if (!data.notes) return [];
    return Object.entries(data.notes).sort(([a], [b]) => a.localeCompare(b));
  }, [data.notes]);

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Heading level={2}>Notes ({notes.length})</Heading>
      <div className="space-y-3">
        {notes.map(([name, content]) => (
          <FileNote key={name} name={name} content={content} />
        ))}
      </div>
    </div>
  );
}

interface FileNoteProps {
  name: string;
  content: string;
}

function FileNote({ name, content }: FileNoteProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Show preview for long notes, full content for short ones
  const isLongNote = content.length > 300 || content.split("\n").length > 5;
  const previewLines = content.split("\n").slice(0, 3).join("\n");
  const preview =
    previewLines.length > 200
      ? previewLines.slice(0, 200) + "…"
      : previewLines + (content.split("\n").length > 3 ? "…" : "");

  return (
    <div className="bg-muted/50 rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <IconNote className="text-muted-foreground size-4 shrink-0" />
        <span className="text-sm font-medium">{name}</span>
      </div>
      {isLongNote ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="text-sm wrap-break-word whitespace-pre-wrap">
            {content}
          </CollapsibleContent>
          {!isOpen && (
            <p className="text-muted-foreground text-sm wrap-break-word whitespace-pre-wrap">
              {preview}
            </p>
          )}
          <CollapsibleTrigger
            className={cn(
              "text-primary hover:text-primary/80 mt-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors",
            )}
          >
            <IconChevronDown
              className={cn(
                "size-4 transition-transform",
                isOpen && "rotate-180",
              )}
            />
            {isOpen ? "Show less" : "Show more"}
          </CollapsibleTrigger>
        </Collapsible>
      ) : (
        <p className="text-sm wrap-break-word whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}
