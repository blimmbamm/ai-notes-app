import { mapNoteFromApi, mapNoteInputToApi, mapNotesFromApi } from "../mappers/notesMapper";
import type { ApiNote, Note, NoteInput } from "../types/api";
import type { AuthSession } from "../types/auth";
import { apiFetch } from "./client";

export function getNotes(auth: AuthSession): Promise<Note[]> {
  return apiFetch<ApiNote[], Note[]>("/notes", {}, auth, true, mapNotesFromApi);
}

export function createNote(payload: NoteInput, auth: AuthSession): Promise<Note> {
  return apiFetch<ApiNote, Note>(
    "/notes",
    {
      method: "POST",
      body: JSON.stringify(mapNoteInputToApi(payload)),
    },
    auth,
    true,
    mapNoteFromApi
  );
}

export function updateNote(id: number, payload: NoteInput, auth: AuthSession): Promise<Note> {
  return apiFetch<ApiNote, Note>(
    `/notes/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(mapNoteInputToApi(payload)),
    },
    auth,
    true,
    mapNoteFromApi
  );
}

export function deleteNote(id: number, auth: AuthSession): Promise<void> {
  return apiFetch<never, void>(
    `/notes/${id}`,
    {
      method: "DELETE",
    },
    auth
  );
}
