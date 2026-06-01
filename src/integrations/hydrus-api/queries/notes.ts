// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteNotes, setNotes } from "../api-client";
import { updateFileMetadataCaches } from "./file-metadata-cache";

import type { DeleteNotesOptions, SetNotesOptions } from "../api-client";
import type { FileMetadata } from "../models";

type SaveFileNoteOptions = Pick<SetNotesOptions, "file_id" | "hash"> & {
  previous_name?: string;
  name: string;
  content: string;
};

function getFileIdFromOptions(options: { file_id?: number }) {
  return options.file_id ? [options.file_id] : undefined;
}

function withSavedNote(
  meta: FileMetadata,
  previousName: string | undefined,
  notes: Record<string, string>,
) {
  const nextNotes = { ...(meta.notes ?? {}) };
  let didChange = false;

  if (previousName && !(previousName in notes) && previousName in nextNotes) {
    delete nextNotes[previousName];
    didChange = true;
  }

  for (const [name, content] of Object.entries(notes)) {
    if (nextNotes[name] === content) continue;
    nextNotes[name] = content;
    didChange = true;
  }

  return didChange ? { ...meta, notes: nextNotes } : meta;
}

function withoutDeletedNotes(meta: FileMetadata, noteNames: Array<string>) {
  if (!meta.notes) return meta;

  const nextNotes = { ...meta.notes };
  let didChange = false;

  for (const noteName of noteNames) {
    if (!(noteName in nextNotes)) continue;
    delete nextNotes[noteName];
    didChange = true;
  }

  if (!didChange) return meta;

  return {
    ...meta,
    notes: Object.keys(nextNotes).length > 0 ? nextNotes : undefined,
  };
}

export const useSaveFileNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: SaveFileNoteOptions) => {
      const { previous_name, name, content, ...identifiers } = options;
      const response = await setNotes({
        ...identifiers,
        notes: { [name]: content },
        merge_cleverly: false,
      });

      if (previous_name && previous_name !== name) {
        await deleteNotes({ ...identifiers, note_names: [previous_name] });
      }

      return response;
    },
    onSuccess: (response, variables) => {
      const fileIds = getFileIdFromOptions(variables);
      updateFileMetadataCaches(queryClient, fileIds, (meta) =>
        withSavedNote(meta, variables.previous_name, response.notes),
      );
    },
    mutationKey: ["saveFileNote"],
  });
};

export const useDeleteFileNotesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: DeleteNotesOptions) => deleteNotes(options),
    onSuccess: (_data, variables) => {
      const fileIds = getFileIdFromOptions(variables);
      updateFileMetadataCaches(queryClient, fileIds, (meta) =>
        withoutDeletedNotes(meta, variables.note_names),
      );
    },
    mutationKey: ["deleteFileNotes"],
  });
};
