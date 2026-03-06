import type { AuthSession } from "../types/auth";
import type { ApiTagCreateRequest, ApiTagRenameRequest } from "../types/api";
import { apiFetch } from "./client";

export function getUserTags(auth: AuthSession): Promise<string[]> {
  return apiFetch<string[]>("/tags", {}, auth);
}

export function createTag(name: string, auth: AuthSession): Promise<void> {
  const payload: ApiTagCreateRequest = { name };
  return apiFetch<undefined>("/tags", { method: "POST", body: JSON.stringify(payload) }, auth);
}

export function renameTag(currentName: string, newName: string, auth: AuthSession): Promise<void> {
  const payload: ApiTagRenameRequest = { currentName, newName };
  return apiFetch<undefined>("/tags", { method: "PUT", body: JSON.stringify(payload) }, auth);
}

export function deleteTag(name: string, auth: AuthSession): Promise<void> {
  return apiFetch<undefined>(`/tags/${encodeURIComponent(name)}`, { method: "DELETE" }, auth);
}
