const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken") || import.meta.env.VITE_SUPER_ADMIN_TOKEN || null;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
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
    throw new Error(body?.error?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

