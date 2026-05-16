// Backend base URL.
// - If `VITE_API_BASE_URL` is unset, use same-origin requests (prevents HTTPS->HTTP mixed-content blocks).
// - For local dev, set `VITE_API_BASE_URL=http://localhost:3006` (or your VPS origin).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

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
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };

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
    throw new ApiClientError(msg, { status: res.status, code, details });
  }

  return res.json();
}
