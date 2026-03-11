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
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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

// --- Organisation (formations, promotions, conventions) ---
export interface Formation {
  id: string;
  name: string;
  level: string | null;
  contractType: string;
  durationMonths: number | null;
  description: string | null;
  active: boolean;
  _count?: { promotions: number };
}

export interface Promotion {
  id: string;
  formationId: string;
  name: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  formation?: { id: string; name: string; level: string | null; contractType: string };
  _count?: { candidates: number; conventions: number };
}

export interface Convention {
  id: string;
  candidateId: string;
  offerId: string;
  companyId: string;
  promotionId: string | null;
  status: string;
  signedAt: string | null;
  documentPath: string | null;
  notes: string | null;
  candidate?: { id: string; firstName: string; lastName: string; formation: string; status: string };
  offer?: { id: string; title: string; jobTitle: string };
  company?: { id: string; name: string };
  promotion?: { id: string; name: string; year: number } | null;
}

export interface OrganisationStats {
  formationsCount: number;
  promotionsCount: number;
  conventionsByStatus: Record<string, number>;
  conventionsSignedThisMonth: number;
}

export const organisationApi = {
  getFormations: (activeOnly?: boolean) =>
    api<Formation[]>(`/organisation/formations${activeOnly ? '?activeOnly=true' : ''}`),
  getFormation: (id: string) => api<Formation>(`/organisation/formations/${id}`),
  createFormation: (body: Partial<Formation>) =>
    api<Formation>('/organisation/formations', { method: 'POST', body: JSON.stringify(body) }),
  updateFormation: (id: string, body: Partial<Formation>) =>
    api<Formation>(`/organisation/formations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteFormation: (id: string) =>
    api<void>(`/organisation/formations/${id}`, { method: 'DELETE' }),

  getPromotions: (formationId?: string, year?: number) => {
    const params = new URLSearchParams();
    if (formationId) params.set('formationId', formationId);
    if (year != null) params.set('year', String(year));
    return api<Promotion[]>(`/organisation/promotions?${params}`);
  },
  getPromotion: (id: string) => api<Promotion>(`/organisation/promotions/${id}`),
  createPromotion: (body: { formationId: string; name: string; year: number; startDate?: string; endDate?: string; capacity?: number }) =>
    api<Promotion>('/organisation/promotions', { method: 'POST', body: JSON.stringify(body) }),
  updatePromotion: (id: string, body: Partial<Promotion>) =>
    api<Promotion>(`/organisation/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePromotion: (id: string) =>
    api<void>(`/organisation/promotions/${id}`, { method: 'DELETE' }),

  getConventions: (filters?: { candidateId?: string; companyId?: string; promotionId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.candidateId) params.set('candidateId', filters.candidateId);
    if (filters?.companyId) params.set('companyId', filters.companyId);
    if (filters?.promotionId) params.set('promotionId', filters.promotionId);
    if (filters?.status) params.set('status', filters.status);
    return api<Convention[]>(`/organisation/conventions?${params}`);
  },
  getConvention: (id: string) => api<Convention>(`/organisation/conventions/${id}`),
  createConvention: (body: { candidateId: string; offerId: string; companyId: string; promotionId?: string; status?: string; signedAt?: string; documentPath?: string; notes?: string }) =>
    api<Convention>('/organisation/conventions', { method: 'POST', body: JSON.stringify(body) }),
  updateConvention: (id: string, body: Partial<Convention>) =>
    api<Convention>(`/organisation/conventions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteConvention: (id: string) =>
    api<void>(`/organisation/conventions/${id}`, { method: 'DELETE' }),

  getStats: () => api<OrganisationStats>('/organisation/stats'),
};

// --- Scolarité (salles, sessions, absences, notes, documents) ---
export interface Room {
  id: string;
  name: string;
  capacity: number | null;
  building: string | null;
  _count?: { sessions: number };
}

export interface Session {
  id: string;
  promotionId: string | null;
  roomId: string | null;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: string;
  promotion?: { id: string; name: string; year: number };
  room?: Room | null;
}

export interface Absence {
  id: string;
  candidateId: string;
  sessionId: string | null;
  date: string;
  type: string;
  justified: boolean;
  notes: string | null;
  candidate?: { id: string; firstName: string; lastName: string };
  session?: Session | null;
}

export interface Grade {
  id: string;
  candidateId: string;
  sessionId: string | null;
  subject: string | null;
  value: number;
  scale: number | null;
  coefficient: number | null;
  label: string | null;
  candidate?: { id: string; firstName: string; lastName: string };
  session?: Session | null;
}

export interface Document {
  id: string;
  candidateId: string | null;
  type: string;
  name: string;
  filePath: string;
  mimeType: string | null;
  candidate?: { id: string; firstName: string; lastName: string };
}

export const schoolingApi = {
  getRooms: () => api<Room[]>('/schooling/rooms'),
  createRoom: (body: { name: string; capacity?: number; building?: string }) =>
    api<Room>('/schooling/rooms', { method: 'POST', body: JSON.stringify(body) }),
  getSessions: (filters?: { promotionId?: string; roomId?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.promotionId) params.set('promotionId', filters.promotionId);
    if (filters?.roomId) params.set('roomId', filters.roomId);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    return api<Session[]>(`/schooling/sessions?${params}`);
  },
  createSession: (body: { promotionId?: string; roomId?: string; title: string; description?: string; startAt: string; endAt: string; type?: string }) =>
    api<Session>('/schooling/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getAbsences: (filters?: { candidateId?: string; sessionId?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.candidateId) params.set('candidateId', filters.candidateId);
    if (filters?.sessionId) params.set('sessionId', filters.sessionId);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    return api<Absence[]>(`/schooling/absences?${params}`);
  },
  createAbsence: (body: { candidateId: string; sessionId?: string; date: string; type?: string; justified?: boolean; notes?: string }) =>
    api<Absence>('/schooling/absences', { method: 'POST', body: JSON.stringify(body) }),
  getGrades: (filters?: { candidateId?: string; sessionId?: string; subject?: string }) => {
    const params = new URLSearchParams();
    if (filters?.candidateId) params.set('candidateId', filters.candidateId);
    if (filters?.sessionId) params.set('sessionId', filters.sessionId);
    if (filters?.subject) params.set('subject', filters.subject ?? '');
    return api<Grade[]>(`/schooling/grades?${params}`);
  },
  createGrade: (body: { candidateId: string; sessionId?: string; subject?: string; value: number; scale?: number; coefficient?: number; label?: string }) =>
    api<Grade>('/schooling/grades', { method: 'POST', body: JSON.stringify(body) }),
  getDocuments: (filters?: { candidateId?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.candidateId) params.set('candidateId', filters.candidateId);
    if (filters?.type) params.set('type', filters.type ?? '');
    return api<Document[]>(`/schooling/documents?${params}`);
  },
  createDocument: (body: { candidateId?: string; type: string; name: string; filePath: string; mimeType?: string }) =>
    api<Document>('/schooling/documents', { method: 'POST', body: JSON.stringify(body) }),
};

// Portail apprenant (candidat connecté)
export const portailApi = {
  getMySchedule: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return api<Session[]>(`/portail/me/schedule?${params}`);
  },
  getMyAbsences: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return api<Absence[]>(`/portail/me/absences?${params}`);
  },
  getMyGrades: () => api<Grade[]>('/portail/me/grades'),
  getMyDocuments: (type?: string) => api<Document[]>(type ? `/portail/me/documents?type=${type}` : '/portail/me/documents'),
};

// Migration Galia (analyse + import)
export type GaliaImportType = 'candidates' | 'companies' | 'formations' | 'promotions' | 'sessions' | 'absences' | 'grades' | 'documents';

export interface GaliaAnalyzeResult {
  headers: string[];
  detectedColumns: Record<string, number>;
  previewRows: string[][];
  rowCount: number;
  errors: string[];
}

export interface GaliaSyncResult {
  candidatesCreated?: number;
  candidatesUpdated?: number;
  companiesCreated?: number;
  companiesUpdated?: number;
  formationsCreated?: number;
  formationsUpdated?: number;
  promotionsCreated?: number;
  promotionsUpdated?: number;
  sessionsCreated?: number;
  absencesCreated?: number;
  gradesCreated?: number;
  documentsCreated?: number;
  errors: string[];
}

export const galiaApi = {
  analyzeCsv: (type: GaliaImportType, csvContent: string) =>
    api<GaliaAnalyzeResult>('/integrations/galia/analyze-csv', {
      method: 'POST',
      body: JSON.stringify({ type, csv: csvContent }),
      headers: { 'Content-Type': 'application/json' },
    }),
  importCandidates: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-candidates', { method: 'POST', body: form });
  },
  importCompanies: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-companies', { method: 'POST', body: form });
  },
  importFormations: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-formations', { method: 'POST', body: form });
  },
  importPromotions: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-promotions', { method: 'POST', body: form });
  },
  importAbsences: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-absences', { method: 'POST', body: form });
  },
  importGrades: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-grades', { method: 'POST', body: form });
  },
  importDocuments: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<GaliaSyncResult>('/integrations/galia/import-documents', { method: 'POST', body: form });
  },
};
