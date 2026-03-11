'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { portailApi, type Document } from '@/lib/api';

const DOC_TYPES: Record<string, string> = {
  SIFA: 'SIFA',
  CERFA: 'CERFA',
  CONVENTION: 'Convention',
  CONTRACT: 'Contrat',
  BULLETIN: 'Bulletin',
  OTHER: 'Autre',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    portailApi
      .getMyDocuments(typeFilter || undefined)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes documents</h1>
        <p className="text-sm text-white/60 mt-1">SIFA, CERFA, conventions, bulletins</p>
      </div>

      <div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-sm"
        >
          <option value="">Tous les types</option>
          {Object.entries(DOC_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((d) => (
            <motion.li
              key={d.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#1a1a1a] rounded-[14px] border border-white/10 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-white">{d.name}</p>
                <p className="text-sm text-white/60">{DOC_TYPES[d.type] ?? d.type}</p>
              </div>
              <a
                href={d.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-totem-accent text-white text-sm font-medium hover:bg-totem-accent-hover"
              >
                Ouvrir
              </a>
            </motion.li>
          ))}
        </ul>
      )}
      {!loading && documents.length === 0 && (
        <p className="text-white/60">Aucun document.</p>
      )}
    </div>
  );
}
