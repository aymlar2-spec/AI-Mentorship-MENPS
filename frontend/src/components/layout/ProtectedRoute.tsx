import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { LoadingState } from "@/components/ui";

interface ProtectedRouteProps {
  /** If provided, only these roles may access the nested routes. */
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute — MENPS design-system component.
 * Redirects unauthenticated users to /login (preserving the intended
 * destination), and redirects authenticated-but-unauthorized users to /403.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingState label="Loading your session…" className="min-h-screen" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
