import type { AuthSession } from "../types/auth";
import { apiFetch } from "./client";

export function getUserTags(auth: AuthSession): Promise<string[]> {
  return apiFetch<string[]>("/tags", {}, auth);
}
