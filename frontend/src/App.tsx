import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ToastViewport } from "@/components/ui";
import { router } from "@/router";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
        <ToastViewport />
      </ToastProvider>
    </AuthProvider>
  );
}
