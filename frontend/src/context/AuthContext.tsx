import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { AuthContextValue } from "../types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readToken(key: "accessToken" | "refreshToken"): string {
  return localStorage.getItem(key) || "";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string>(() => readToken("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string>(() => readToken("refreshToken"));

  const setTokens = (nextAccessToken: string, nextRefreshToken: string) => {
    setAccessToken(nextAccessToken || "");
    setRefreshToken(nextRefreshToken || "");

    if (nextAccessToken) {
      localStorage.setItem("accessToken", nextAccessToken);
    } else {
      localStorage.removeItem("accessToken");
    }

    if (nextRefreshToken) {
      localStorage.setItem("refreshToken", nextRefreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  };

  const logout = () => setTokens("", "");

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken) && Boolean(refreshToken),
      setTokens,
      logout,
    }),
    [accessToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
