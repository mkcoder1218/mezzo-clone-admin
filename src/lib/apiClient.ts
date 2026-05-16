// Backend base URL. Prefer VITE_API_BASE_URL, fall back to the local backend default port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3006";

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
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
