import { apiFetch } from "./client";

export function getNotes(auth) {
  return apiFetch("/notes", {}, auth);
}

export function createNote(payload, auth) {
  return apiFetch(
    "/notes",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    auth
  );
}

export function updateNote(id, payload, auth) {
  return apiFetch(
    `/notes/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    auth
  );
}

export function deleteNote(id, auth) {
  return apiFetch(
    `/notes/${id}`,
    {
      method: "DELETE",
    },
    auth
  );
}
