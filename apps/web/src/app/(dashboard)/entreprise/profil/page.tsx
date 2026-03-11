'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function EntrepriseProfilPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const companyId = user?.companyId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    api<any>(`/companies/${companyId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (!companyId && !loading) {
    router.replace('/login');
    return null;
  }

  if (loading || !data) {
    return (
      <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Profil entreprise</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
      >
        <div>
          <p className="text-sm text-slate-500">Nom</p>
          <p className="font-medium">{data.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Secteur</p>
          <p className="font-medium">{data.sector}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Adresse</p>
          <p className="font-medium">{data.address}, {data.city}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Statut</p>
          <p className="font-medium">{data.status}</p>
        </div>
      </motion.div>
    </div>
  );
}
