'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'choose';

function ReponseMatchContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const reponse = searchParams.get('reponse'); // oui | non
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const submit = useCallback(
    async (response: string) => {
      if (!token) {
        setStatus('error');
        setMessage('Lien invalide.');
        return;
      }
      setStatus('loading');
      try {
        const res = await fetch(`${API_URL}/matches/respond-by-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            response: response === 'oui' ? 'YES' : 'NO',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Erreur');
        }
        setStatus('success');
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || 'Lien invalide ou déjà utilisé.');
      }
    },
    [token],
  );

  useEffect(() => {
    if (status !== 'idle') return;
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide.');
      return;
    }
    if (reponse === 'oui' || reponse === 'non') {
      submit(reponse);
      return;
    }
    setStatus('choose');
  }, [token, reponse, status, submit]);

  if (status === 'choose') {
    const base = '/reponse-match';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Une offre vous a été proposée</h1>
          <p className="text-slate-600 mb-6">Souhaitez-vous que nous transmettions votre candidature ?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`${base}?token=${token}&reponse=oui`}
              className="inline-block px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
            >
              Oui, je suis intéressé(e)
            </Link>
            <Link
              href={`${base}?token=${token}&reponse=non`}
              className="inline-block px-6 py-3 bg-slate-500 text-white font-medium rounded-lg hover:bg-slate-600 transition"
            >
              Non, merci
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-6">L&apos;équipe Totem</p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <p className="text-slate-600">Enregistrement en cours...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Merci</h1>
          <p className="text-slate-600 mb-6">Nous avons bien enregistré votre réponse. L&apos;équipe Totem vous recontactera si nécessaire.</p>
          <p className="text-sm text-slate-500">L&apos;équipe Totem</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Lien invalide</h1>
        <p className="text-slate-600 mb-6">{message}</p>
        <p className="text-sm text-slate-500">Ce lien a peut-être déjà été utilisé ou a expiré.</p>
      </div>
    </div>
  );
}

export default function ReponseMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
            <p className="text-slate-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <ReponseMatchContent />
    </Suspense>
  );
}
