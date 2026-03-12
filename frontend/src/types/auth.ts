export interface AuthSession {
  logout: () => void;
}

export interface AuthContextValue extends AuthSession {
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthenticated: (value: boolean) => void;
}
