import type { ApiNote, ApiNoteRequest, Note, NoteInput } from "../types/api";

export function mapNoteFromApi(api: ApiNote): Note {
  return {
    id: api.id,
    title: api.title,
    content: api.content,
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  };
}

export function mapNotesFromApi(apiNotes: ApiNote[]): Note[] {
  return apiNotes.map(mapNoteFromApi);
}

export function mapNoteInputToApi(input: NoteInput): ApiNoteRequest {
  return {
    title: input.title,
    content: input.content,
  };
}
