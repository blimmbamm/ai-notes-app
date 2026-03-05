export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export interface AuthContextValue extends AuthSession {
  isAuthenticated: boolean;
}
