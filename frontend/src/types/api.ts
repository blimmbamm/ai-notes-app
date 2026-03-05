export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
}

export interface ApiMessageResponse {
  message: string;
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface ApiNote {
  id: number;
  title: string;
  content: string;
  colorHex: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiNoteRequest {
  title: string;
  content: string;
  colorHex: string | null;
}

export interface ApiAccountResponse {
  email: string;
  createdAt: string;
}

export type MapIsoDateFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: Date;
};

export type Note = MapIsoDateFields<ApiNote, "createdAt" | "updatedAt">;
export type AccountProfile = MapIsoDateFields<ApiAccountResponse, "createdAt">;

export interface NoteInput {
  title: string;
  content: string;
  colorHex: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}
