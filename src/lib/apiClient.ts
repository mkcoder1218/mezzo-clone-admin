// Backend base URL.
// - If `VITE_API_BASE_URL` is unset, use same-origin requests (prevents HTTPS->HTTP mixed-content blocks).
// - For local dev, set `VITE_API_BASE_URL=http://localhost:3006` (or your VPS origin).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function formatDetails(details: unknown): string {
  if (details == null || details === "") return "";
  if (typeof details === "string") return details;
  if (Array.isArray(details)) {
    return details
      .map((item) => formatDetails(item))
      .filter(Boolean)
      .join("; ");
  }
  if (typeof details === "object") {
    const detailRecord = details as Record<string, unknown>;
    if (Array.isArray(detailRecord.issues)) {
      return detailRecord.issues
        .map((issue) => {
          if (!issue || typeof issue !== "object") return formatDetails(issue);
          const issueRecord = issue as Record<string, unknown>;
          const path = Array.isArray(issueRecord.path) ? issueRecord.path.join(".") : "";
          const message = issueRecord.message ? String(issueRecord.message) : "";
          return [path, message].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join("; ");
    }

    return Object.entries(details as Record<string, unknown>)
      .map(([key, value]) => {
        const rendered = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
        return `${key}: ${rendered}`;
      })
      .join("; ");
  }
  return String(details);
}

function showErrorToast(message: string, details?: unknown) {
  if (typeof window === "undefined") return;
  const detailText = formatDetails(details);
  window.dispatchEvent(new CustomEvent("admin-toast", {
    detail: {
      variant: "error",
      title: message,
      message: detailText,
    },
  }));
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, args: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiClientError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const inputBody: any = (options as any).body;
  const shouldJsonEncodeBody =
    inputBody != null &&
    typeof inputBody === "object" &&
    !(inputBody instanceof FormData) &&
    !(inputBody instanceof URLSearchParams) &&
    !(inputBody instanceof Blob) &&
    !(inputBody instanceof ArrayBuffer);

  const body = shouldJsonEncodeBody ? JSON.stringify(inputBody) : (options.body as any);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  // Only set JSON content-type when we actually send JSON.
  // For FormData, the browser must set the multipart boundary.
  const isStringBody = typeof inputBody === "string";
  if (shouldJsonEncodeBody || isStringBody || inputBody == null) {
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    headers
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || "Request failed";
    const code = body?.error?.code;
    const details = body?.error?.details;
    showErrorToast(msg, details);
    throw new ApiClientError(msg, { status: res.status, code, details });
  }

  return res.json();
}
