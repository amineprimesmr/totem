'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [list, setList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User[]>('/users/school')
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin',
    COMMERCIAL: 'Commercial',
    ADMISSION: "Chargé d'admission",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs école</h1>
        <p className="text-sm text-slate-500 mt-1">Comptes de l&apos;équipe Totem</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {list.map((u, i) => (
              <motion.li
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{u.name || u.email}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                  {roleLabel[u.role] ?? u.role}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
