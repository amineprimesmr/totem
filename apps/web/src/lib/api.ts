import { useAuthStore } from './auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return useAuthStore.getState().token ?? localStorage.getItem('totem_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error('API indisponible (backend non démarré)');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const msg = err?.message;
    const text = Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Erreur API';
    throw new Error(text || String(res.status) || 'Erreur API');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Télécharge un fichier (ex. CSV) avec le token et déclenche le téléchargement. */
export async function downloadExport(path: string, filename: string): Promise<void> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: RegisterPayload) =>
    api<{ access_token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string | null;
  candidateId?: string;
  companyId?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  role: string;
  candidate?: {
    firstName: string;
    lastName: string;
    phone?: string;
    formation: string;
    city: string;
    postalCode?: string;
    sectors?: string[];
    desiredJob?: string[];
    contractType?: string;
    searchRadiusKm?: number;
  };
  company?: {
    name: string;
    sector: string;
    address: string;
    city: string;
    postalCode?: string;
    phone?: string;
  };
}
