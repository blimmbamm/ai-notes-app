import type { ApiMessageResponse } from "../types/api";
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

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
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
  return apiFetch<ApiMessageResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    null,
    false
  );
}

export function logout(auth: AuthSession): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(
    "/auth/logout",
    {
      method: "POST",
    },
    auth
  );
}

export function requestPasswordReset(payload: PasswordResetRequest): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(
    "/auth/password-reset/request",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function confirmPasswordReset(payload: PasswordResetConfirmRequest): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(
    "/auth/password-reset/confirm",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
