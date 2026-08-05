import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card padding="lg" className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span className="inline-flex rounded-full bg-danger-light p-3 text-danger">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-text">Access denied</h1>
        <p className="text-sm text-text-muted">
          You don't have permission to view this page. If you think this is a mistake, contact your
          program administrator.
        </p>
        <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Return to dashboard
        </Link>
      </Card>
    </div>
  );
}
