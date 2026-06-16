/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch, parseErrorResponse } from './apiClient';

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  role: string;
}

export interface UserSession {
  name: string;
  email: string;
  token: string;
  role: string;
}

const SESSION_KEY = 'vpro_session';
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/me', {}, token);
}

export function saveSession(session: UserSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getStoredSession(): UserSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as UserSession;
    if (parsed?.email && parsed?.name && parsed?.token) {
      return {
        ...parsed,
        role: parsed.role ?? 'USER',
      };
    }
  } catch {
    // corrupted session
  }

  return null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function buildSession(auth: AuthResponse): UserSession {
  return {
    name: auth.name,
    email: auth.email,
    token: auth.token,
    role: auth.role ?? 'USER',
  };
}

export function isAdmin(session: UserSession | null): boolean {
  return session?.role === 'ADMIN';
}
