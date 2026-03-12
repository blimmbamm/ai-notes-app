export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
}

export interface ApiMessageResponse {
  message: string;
}


export interface ApiNote {
  id: number;
  title: string;
  content: string;
  colorHex: string | null;
  tagNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiNoteRequest {
  title: string;
  content: string;
  colorHex: string | null;
  tagNames: string[];
}

export interface ApiTagCreateRequest {
  name: string;
}

export interface ApiTagRenameRequest {
  currentName: string;
  newName: string;
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
  tagNames: string[];
}
