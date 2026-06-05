import Constants from 'expo-constants';

import { getUserSession } from '@/lib/session';

export function getApiUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3001`;
  }

  return 'http://127.0.0.1:3001';
}

type ApiOptions = {
  method?: string;
  body?: unknown;
};

export type ApiResponse<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const session = getUserSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(`No se pudo conectar al backend en ${getApiUrl()}.`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Error en la solicitud.');
  }

  return data as ApiResponse<T>;
}
