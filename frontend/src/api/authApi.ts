import { mapAuthResponse } from "../mappers/authMapper";
import type { ApiAuthResponse, ApiMessageResponse, AuthTokensResponse } from "../types/api";
import type { AuthSession } from "../types/auth";
import { apiFetch } from "./client";

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export function signup(payload: SignupRequest): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(token: string): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(`/auth/verify?token=${encodeURIComponent(token)}`);
}

export function login(payload: LoginRequest) {
  return apiFetch<ApiAuthResponse, AuthTokensResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    null,
    true,
    mapAuthResponse
  );
}

export function logout(payload: LogoutRequest, auth: AuthSession): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    auth
  );
}
