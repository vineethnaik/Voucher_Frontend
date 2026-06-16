/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.message) {
      return data.message;
    }
  } catch {
    // ignore parse errors
  }
  return 'Something went wrong. Please try again.';
}

export function getApiBase(): string {
  return API_BASE;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
