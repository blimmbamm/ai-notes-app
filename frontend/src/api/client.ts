import type { ApiErrorResponse } from "../types/api";
import type { AuthSession } from "../types/auth";

const API_BASE = "/api";

type Mapper<TApi, TModel> = (apiData: TApi) => TModel;

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      "message" in value &&
      typeof (value as { message: unknown }).message === "string"
  );
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return null;
}

export async function apiFetch<TApi, TModel = TApi>(
  path: string,
  options: RequestInit = {},
  auth: AuthSession | null = null,
  allowRefresh = true,
  mapResponse?: Mapper<TApi, TModel>
): Promise<TModel> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  const shouldTryRefresh =
    (response.status === 401 || response.status === 403) &&
    allowRefresh &&
    path !== "/auth/refresh" &&
    path !== "/auth/login";

  if (shouldTryRefresh) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });

    if (refreshResponse.ok) {
      return apiFetch<TApi, TModel>(
        path,
        options,
        auth,
        false,
        mapResponse
      );
    }

    auth?.logout();
    throw new Error("Session expired. Please login again.");
  }

  const data = await parseJson<TApi | ApiErrorResponse>(response);

  if (!response.ok) {
    const message = isApiErrorResponse(data)
      ? data.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (data === null) {
    return undefined as TModel;
  }

  if (mapResponse) {
    return mapResponse(data as TApi);
  }

  return data as TModel;
}
