/**
 * Mirrors backend error shape from app.utils.exceptions.AppException handler:
 * { "detail": "..." }
 */
export interface ApiErrorBody {
  detail: string;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Generic async request state used across pages/hooks to drive
 * Loading / Empty / Error / Success UI consistently.
 */
export type RequestStatus = "idle" | "loading" | "success" | "error";
