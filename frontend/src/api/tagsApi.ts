import type { AuthSession } from "../types/auth";
import { apiFetch } from "./client";

export function getTagSuggestions(query: string, auth: AuthSession): Promise<string[]> {
  return apiFetch<string[]>(`/tags?query=${encodeURIComponent(query)}`, {}, auth);
}
