'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

export default function CandidatProfilPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const candidateId = user?.candidateId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProfile = useCallback(() => {
    if (!candidateId) return;
    setLoadError(null);
    setLoading(true);
    api<any>(`/candidates/${candidateId}`)
      .then((d) => {
        setData(d);
        setLoadError(null);
      })
      .catch((e: any) => {
        setData(null);
        setLoadError(e?.message || 'Erreur réseau');
      })
      .finally(() => setLoading(false));
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [candidateId, fetchProfile]);

  async function updateStatus(newStatus: string) {
    if (!candidateId) return;
    const url = `/candidates/${candidateId}/status`;
    try {
      await api(url, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success('Profil mis à jour');
      setData((d: any) => (d ? { ...d, status: newStatus } : d));
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur';
      if (msg.includes('Cannot PATCH') || msg.includes('404')) {
        toast.error('Impossible de mettre à jour. Redémarrez l’API (npm run dev:api) puis réessayez.');
      } else {
        toast.error(msg);
      }
    }
  }

  if (user && !candidateId && !loading) {
    router.replace('/login');
    return null;
  }

  if (!candidateId || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    const isChunkError = loadError && (loadError.includes('Loading chunk') || loadError.includes('ChunkLoadError'));
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 mb-2">Impossible de charger le profil.</p>
          {isChunkError ? (
            <p className="text-sm text-amber-700 mb-4">
              Une mise à jour de l’app est disponible. Rechargez la page (F5 ou Cmd+R).
            </p>
          ) : (
            loadError && <p className="text-sm text-amber-700 mb-4">{loadError}</p>
          )}
          <button
            type="button"
            onClick={() => (isChunkError ? window.location.reload() : fetchProfile())}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
          >
            {isChunkError ? 'Recharger la page' : 'Réessayer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
      >
        <div>
          <p className="text-sm text-slate-500">Nom</p>
          <p className="font-medium">{data.firstName} {data.lastName}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium">{data.user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Formation</p>
          <p className="font-medium">{data.formation}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Ville</p>
          <p className="font-medium">{data.city}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Statut</p>
          <p className="font-medium">{data.status}</p>
          {data.status === 'REGISTERED' && (
            <button
              type="button"
              onClick={() => updateStatus('SEARCHING')}
              className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Passer en « En recherche »
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
