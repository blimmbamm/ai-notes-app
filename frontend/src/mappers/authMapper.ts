import type { ApiAuthResponse, AuthTokensResponse } from "../types/api";

export function mapAuthResponse(api: ApiAuthResponse): AuthTokensResponse {
  return {
    accessToken: api.accessToken,
    refreshToken: api.refreshToken,
    tokenType: api.tokenType,
    expiresInSeconds: api.expiresInSeconds,
  };
}
