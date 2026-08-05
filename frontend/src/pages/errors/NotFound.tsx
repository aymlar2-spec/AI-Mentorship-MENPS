import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card padding="lg" className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <span className="inline-flex rounded-full bg-primary-light p-3 text-primary">
          <CompassIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-text">404</h1>
        <p className="text-sm text-text-muted">
          We couldn't find the page you're looking for. It may have been moved or doesn't exist.
        </p>
        <Button onClick={() => window.history.back()} variant="outline" size="sm">
          Go back
        </Button>
        <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Return to dashboard
        </Link>
      </Card>
    </div>
  );
}
