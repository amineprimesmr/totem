'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { portailApi, type Grade } from '@/lib/api';

export default function NotesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portailApi
      .getMyGrades()
      .then(setGrades)
      .catch(() => setGrades([]))
      .finally(() => setLoading(false));
  }, []);

  const bySubject = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    const key = g.subject || 'Autre';
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes notes</h1>
        <p className="text-sm text-white/60 mt-1">Relevé de notes</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(bySubject).map(([subject, list]) => (
            <section key={subject} className="bg-[#1a1a1a] rounded-[14px] border border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white mb-3">{subject}</h2>
              <ul className="space-y-2">
                {list.map((g) => (
                  <li key={g.id} className="flex justify-between items-center">
                    <span className="text-white/80">{g.label || 'Note'}</span>
                    <span className="font-bold text-totem-accent">
                      {g.value}
                      {g.scale ? ` / ${g.scale}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {!loading && grades.length === 0 && (
        <p className="text-white/60">Aucune note enregistrée.</p>
      )}
    </div>
  );
}
