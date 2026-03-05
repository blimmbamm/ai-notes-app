import type { ApiAccountResponse, AccountProfile } from "../types/api";

export function mapAccountFromApi(api: ApiAccountResponse): AccountProfile {
  return {
    email: api.email,
    createdAt: new Date(api.createdAt),
  };
}
