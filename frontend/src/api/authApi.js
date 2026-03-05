import { apiFetch } from "./client";

export function signup(payload) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(token) {
  return apiFetch(`/auth/verify?token=${encodeURIComponent(token)}`);
}

export function login(payload) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(payload, auth) {
  return apiFetch(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    auth
  );
}
