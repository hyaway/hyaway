// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useId, useMemo, useState } from "react";
import {
  IconChevronDown,
  IconDeviceFloppy,
  IconDots,
  IconEdit,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { FormEvent } from "react";

import type { FileMetadata } from "@/integrations/hydrus-api/models";
import { SectionHeading } from "@/components/page-shell/section-heading";
import { Button } from "@/components/ui-primitives/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui-primitives/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-primitives/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui-primitives/field";
import { Input } from "@/components/ui-primitives/input";
import { Separator } from "@/components/ui-primitives/separator";
import { Textarea } from "@/components/ui-primitives/textarea";
import {
  useDeleteFileNotesMutation,
  useSaveFileNoteMutation,
} from "@/integrations/hydrus-api/queries/notes";
import { usePermissions } from "@/integrations/hydrus-api/queries/permissions";
import { Permission } from "@/integrations/hydrus-api/models";
import { cn } from "@/lib/utils";

interface FileNotesSectionProps {
  data: FileMetadata;
}

export function FileNotesSection({ data }: FileNotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { hasPermission } = usePermissions();
  const canEditNotes = hasPermission(Permission.EDIT_FILE_NOTES);
  const notes = useMemo(() => {
    if (!data.notes) return [];
    return Object.entries(data.notes).sort(([a], [b]) => a.localeCompare(b));
  }, [data.notes]);
  const noteNames = useMemo(() => notes.map(([name]) => name), [notes]);

  if (notes.length === 0 && !canEditNotes) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <SectionHeading
          title={`Notes (${notes.length})`}
          right={
            canEditNotes ? (
              <Button
                className="ml-auto"
                disabled={isAdding}
                size="sm"
                variant="outline"
                onClick={() => setIsAdding(true)}
              >
                <IconPlus data-icon="inline-start" />
                Add note
              </Button>
            ) : null
          }
        />
        {isAdding && canEditNotes ? (
          <InlineNoteEditor
            fileId={data.file_id}
            noteNames={noteNames}
            onCancel={() => setIsAdding(false)}
          />
        ) : null}
        {notes.length > 0 ? (
          <div className="flex flex-col gap-3">
            {notes.map(([name, content]) => (
              <FileNote
                key={name}
                fileId={data.file_id}
                name={name}
                content={content}
                canEditNotes={canEditNotes}
                noteNames={noteNames}
              />
            ))}
          </div>
        ) : !isAdding ? (
          <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            No notes yet.
          </div>
        ) : null}
      </div>
      <Separator className="my-2" />
    </>
  );
}

interface FileNoteProps {
  fileId: number;
  name: string;
  content: string;
  canEditNotes: boolean;
  noteNames: Array<string>;
}

function FileNote({
  fileId,
  name,
  content,
  canEditNotes,
  noteNames,
}: FileNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: deleteFileNotes, isPending: isDeleting } =
    useDeleteFileNotesMutation();

  const isLongNote = content.length > 300 || content.split("\n").length > 5;
  const previewLines = content.split("\n").slice(0, 3).join("\n");
  const preview =
    previewLines.length > 200
      ? previewLines.slice(0, 200) + "…"
      : previewLines + (content.split("\n").length > 3 ? "…" : "");

  const handleDelete = () => {
    if (!canEditNotes || isDeleting) return;

    deleteFileNotes({ file_id: fileId, note_names: [name] });
  };

  if (isEditing && canEditNotes) {
    return (
      <InlineNoteEditor
        fileId={fileId}
        noteNames={noteNames}
        originalName={name}
        originalContent={content}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="bg-muted/50 rounded-sm p-3 transition-colors">
      <div className="flex items-start gap-3">
        <dl className="min-w-0 flex-1 text-sm">
          <dt className="text-muted-foreground font-medium wrap-break-word">
            {name}
          </dt>
          <dd className="mt-1 min-w-0 text-sm/6 wrap-break-word whitespace-pre-wrap">
            {isLongNote ? (
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                {!isOpen && <p>{preview}</p>}
                <CollapsibleContent>{content}</CollapsibleContent>
                <CollapsibleTrigger
                  className={cn(
                    "text-foreground hover:bg-muted mt-2 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium transition-colors",
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
              content
            )}
          </dd>
        </dl>
        {canEditNotes ? (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={`Actions for note ${name}`}
                    title="Note actions"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                  >
                    <IconDots className="size-5" />
                  </Button>
                }
              />
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <IconEdit />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isDeleting}
                  onClick={handleDelete}
                  variant="destructive"
                >
                  <IconTrash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface InlineNoteEditorProps {
  fileId: number;
  noteNames: Array<string>;
  onCancel: () => void;
  originalName?: string;
  originalContent?: string;
}

function InlineNoteEditor({
  fileId,
  noteNames,
  onCancel,
  originalName,
  originalContent = "",
}: InlineNoteEditorProps) {
  const nameId = useId();
  const contentId = useId();
  const [name, setName] = useState(
    originalName ?? getDefaultNoteName(noteNames),
  );
  const [content, setContent] = useState(originalContent);
  const [nameError, setNameError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const { mutate: saveFileNote, isPending } = useSaveFileNoteMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Note name is required.");
      return;
    }

    if (!content.trim()) {
      setContentError("Note content is required.");
      return;
    }

    if (trimmedName !== originalName && noteNames.includes(trimmedName)) {
      setNameError("A note with this name already exists.");
      return;
    }

    if (trimmedName === originalName && content === originalContent) {
      onCancel();
      return;
    }

    saveFileNote(
      {
        file_id: fileId,
        previous_name: originalName,
        name: trimmedName,
        content,
      },
      {
        onSuccess: () => {
          onCancel();
        },
        onError: (mutationError) => {
          setContentError(formatMutationError(mutationError));
        },
      },
    );
  };

  return (
    <form
      className="bg-muted/50 rounded-sm p-3 transition-colors"
      onSubmit={handleSubmit}
    >
      <div className="grid min-w-0 gap-3">
        <Field>
          <FieldLabel htmlFor={nameId}>Name</FieldLabel>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
            disabled={isPending}
            autoComplete="off"
            required
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor={contentId}>Content</FieldLabel>
          <Textarea
            id={contentId}
            className="max-h-[50vh] min-h-48 resize-y"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setContentError(null);
            }}
            disabled={isPending}
            required
          />
          {contentError ? <FieldError>{contentError}</FieldError> : null}
          <FieldDescription>
            {content.length.toLocaleString()} characters
          </FieldDescription>
        </Field>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            <IconX data-icon="inline-start" />
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            <IconDeviceFloppy data-icon="inline-start" />
            Save note
          </Button>
        </div>
      </div>
    </form>
  );
}

function getDefaultNoteName(noteNames: Array<string>) {
  const baseName = "note";
  if (!noteNames.includes(baseName)) return baseName;

  let index = 1;
  while (noteNames.includes(`${baseName} (${index})`)) {
    index++;
  }
  return `${baseName} (${index})`;
}

function formatMutationError(error: unknown) {
  return error instanceof Error ? error.message : "Note update failed.";
}
