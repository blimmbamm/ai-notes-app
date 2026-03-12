import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  return isAuthenticated ? <Navigate to="/notes" replace /> : <Outlet />;
}
