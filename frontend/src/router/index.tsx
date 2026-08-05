/* eslint-disable react-refresh/only-export-components -- this is a router
   config module (lazy-loaded page references + the router object), never
   meaningfully hot-reloaded as a component; splitting it further would add
   indirection with no real benefit. */
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell, ProtectedRoute } from "@/components/layout";
import { LoadingState } from "@/components/ui";

// Route-level code splitting: each page ships as its own chunk instead of
// one large bundle (react-markdown, in particular, is only needed by the
// AI Chat / History pages).
const Login = lazy(() => import("@/pages/auth/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const Matching = lazy(() => import("@/pages/Matching"));
const AIChat = lazy(() => import("@/pages/AIChat"));
const History = lazy(() => import("@/pages/History"));
const Administration = lazy(() => import("@/pages/Administration"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/errors/NotFound"));
const Forbidden = lazy(() => import("@/pages/errors/Forbidden"));

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<LoadingState label="Chargement…" className="min-h-[50vh]" />}>
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: withSuspense(<Login />) },
  { path: "/403", element: withSuspense(<Forbidden />) },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: withSuspense(<Dashboard />) },
          { path: "/profile", element: withSuspense(<Profile />) },
          { path: "/chat", element: withSuspense(<AIChat />) },
          { path: "/history", element: withSuspense(<History />) },
          { path: "/settings", element: withSuspense(<Settings />) },
          {
            element: <ProtectedRoute allowedRoles={["mentee", "admin"]} />,
            children: [{ path: "/matching", element: withSuspense(<Matching />) }],
          },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [{ path: "/admin", element: withSuspense(<Administration />) }],
          },
        ],
      },
    ],
  },

  { path: "*", element: withSuspense(<NotFound />) },
]);
