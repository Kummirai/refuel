// src/services/api.ts
// Centralized API client — consistent error handling, same pattern as RN app

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
};

async function request<T>(
  method: string,
  path: string,
  opts?: RequestOptions,
): Promise<{ data?: T; error?: string }> {
  const url = new URL(path, window.location.origin);
  if (opts?.params) {
    Object.entries(opts.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    ...(opts?.headers as Record<string, string>),
  };

  if (opts?.body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });

    if (res.ok) {
      const text = await res.text();
      const data = text ? JSON.parse(text) : undefined;
      return { data: data as T };
    }

    let errorMsg = `Request failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody.error || errBody.message) {
        errorMsg = errBody.error || errBody.message;
      }
    } catch {
      // ignore parse errors
    }

    return { error: errorMsg };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

async function uploadFile<T>(
  path: string,
  formData: FormData,
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const text = await res.text();
      const data = text ? JSON.parse(text) : undefined;
      return { data: data as T };
    }

    let errorMsg = `Upload failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody.error || errBody.message) {
        errorMsg = errBody.error || errBody.message;
      }
    } catch {
      // ignore
    }

    return { error: errorMsg };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, opts),

  post: <T>(path: string, opts?: RequestOptions) =>
    request<T>("POST", path, opts),

  put: <T>(path: string, opts?: RequestOptions) =>
    request<T>("PUT", path, opts),

  patch: <T>(path: string, opts?: RequestOptions) =>
    request<T>("PATCH", path, opts),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, opts),

  upload: <T>(path: string, formData: FormData) =>
    uploadFile<T>(path, formData),
};
