import Constants from 'expo-constants';

import { getUserSession } from '@/lib/session';

export function getApiUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3001`;
  }

  return 'http://localhost:3001';
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

  const response = await fetch(`${getApiUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error en la solicitud.');
  }

  return data as ApiResponse<T>;
}
