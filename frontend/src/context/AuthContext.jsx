import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

function readToken(key) {
  return localStorage.getItem(key) || "";
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => readToken("accessToken"));
  const [refreshToken, setRefreshToken] = useState(() => readToken("refreshToken"));

  const setTokens = (nextAccessToken, nextRefreshToken) => {
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

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      setTokens,
      logout,
    }),
    [accessToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
