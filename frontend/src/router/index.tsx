import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell, ProtectedRoute } from "@/components/layout";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Matching from "@/pages/Matching";
import AIChat from "@/pages/AIChat";
import History from "@/pages/History";
import Administration from "@/pages/Administration";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/errors/NotFound";
import Forbidden from "@/pages/errors/Forbidden";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <Login /> },
  { path: "/403", element: <Forbidden /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/profile", element: <Profile /> },
          { path: "/chat", element: <AIChat /> },
          { path: "/history", element: <History /> },
          { path: "/settings", element: <Settings /> },
          {
            element: <ProtectedRoute allowedRoles={["mentee", "admin"]} />,
            children: [{ path: "/matching", element: <Matching /> }],
          },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [{ path: "/admin", element: <Administration /> }],
          },
        ],
      },
    ],
  },

  { path: "*", element: <NotFound /> },
]);
