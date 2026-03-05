import type { ApiAccountResponse, ApiMessageResponse, AccountProfile } from "../types/api";
import type { AuthSession } from "../types/auth";
import { mapAccountFromApi } from "../mappers/accountMapper";
import { apiFetch } from "./client";

export function getAccount(auth: AuthSession): Promise<AccountProfile> {
  return apiFetch<ApiAccountResponse, AccountProfile>("/account/me", {}, auth, true, mapAccountFromApi);
}

export function requestCurrentUserPasswordReset(auth: AuthSession): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(
    "/account/password-reset-request",
    {
      method: "POST",
    },
    auth
  );
}

export function deleteAccount(auth: AuthSession): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(
    "/account",
    {
      method: "DELETE",
    },
    auth
  );
}
