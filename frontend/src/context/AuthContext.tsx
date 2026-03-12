import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { AuthContextValue } from "../types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => setAuthenticated(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/account/me", { credentials: "same-origin" });
        if (response.ok) {
          if (!cancelled) {
            setAuthenticated(true);
          }
          return;
        }

        if (response.status === 401 || response.status === 403) {
          const refreshResponse = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "same-origin",
          });

          if (refreshResponse.ok) {
            const retry = await fetch("/api/account/me", { credentials: "same-origin" });
            if (!cancelled) {
              setAuthenticated(retry.ok);
            }
            return;
          }
        }

        if (!cancelled) {
          setAuthenticated(false);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      setAuthenticated,
      logout,
    }),
    [isAuthenticated, isLoading]
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
