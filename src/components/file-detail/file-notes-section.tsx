// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import { IconChevronDown, IconNote } from "@tabler/icons-react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { SectionHeading } from "@/components/page-shell/section-heading";
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
    <div className="flex flex-col gap-4">
      <SectionHeading title={`Notes (${notes.length})`} />
      <div className="flex flex-col gap-3">
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
    <div className="bg-muted/50 flex items-start gap-2 rounded-lg border p-3 transition-colors">
      <IconNote className="text-muted-foreground mt-1.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
        </div>
        {isLongNote ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {!isOpen && (
              <p className="text-muted-foreground text-sm wrap-break-word whitespace-pre-wrap">
                {preview}
              </p>
            )}
            <CollapsibleContent className="text-sm wrap-break-word whitespace-pre-wrap">
              {content}
            </CollapsibleContent>
            <CollapsibleTrigger
              className={cn(
                "text-foreground hover:bg-muted mt-2 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-0.5 text-sm font-medium transition-colors",
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
          <p className="text-sm wrap-break-word whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </div>
  );
}
