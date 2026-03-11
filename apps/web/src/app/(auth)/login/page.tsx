'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api, authApi, type AuthUser } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreIfPossible = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('totem_token') : null;
      if (!token) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const me = await api<AuthUser>('/users/me');
        if (cancelled) return;
        setAuth(me, token);
        router.replace('/dashboard');
      } catch {
        if (typeof window !== 'undefined') localStorage.removeItem('totem_token');
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    restoreIfPossible();
    return () => {
      cancelled = true;
    };
  }, [router, setAuth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.user, res.access_token);
      toast.success('Connexion réussie');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string | string[] }).message : null;
      const text = Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Erreur de connexion';
      toast.error(text || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-[480px] bg-gradient-to-b from-white via-[#fefefe] to-[#fcfcfc] p-6 md:p-8 rounded-[24px] shadow-auth-card hover:shadow-[0_-1px_4px_rgba(255,255,255,0.98)_inset,2px_2px_4px_rgba(0,0,0,0.04),8px_10px_24px_rgba(0,0,0,0.07),16px_20px_48px_rgba(0,0,0,0.09)] transition-shadow duration-200 animate-auth-card-in"
    >
      <Link
        href="/"
        className="flex items-center justify-center w-11 h-11 mx-auto mb-6 bg-[#f8f9fc] rounded-xl text-[#2d3748] no-underline shadow-[inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(0,0,0,0.06)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_4px_rgba(0,0,0,0.08)] hover:scale-[0.98] transition-all"
        aria-label="Retour à l'accueil"
      >
        <span className="text-sm font-semibold tracking-wide">←</span>
      </Link>

      <h1 className="text-2xl font-bold text-[#2d3748] mb-2">Se connecter</h1>
      <p className="text-[#718096] mb-6 text-sm">
        Accédez à votre espace Totem. Gestion candidats, entreprises et offres.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#2d3748] mb-2">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#e2e8f0] bg-white text-[#2d3748] placeholder:text-[#a0aec0] focus:outline-none focus:border-totem-accent focus:ring-2 focus:ring-totem-accent/20 transition-all"
              placeholder="Email"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#2d3748] mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#e2e8f0] bg-white text-[#2d3748] placeholder:text-[#a0aec0] focus:outline-none focus:border-totem-accent focus:ring-2 focus:ring-totem-accent/20 transition-all"
              placeholder="Mot de passe"
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || checkingSession}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-totem-accent hover:bg-totem-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_-1px_0_rgba(255,255,255,0.12)_inset,0_2px_4px_rgba(0,0,0,0.15),0_6px_16px_rgba(10,124,66,0.25)] hover:shadow-[0_-1px_0_rgba(255,255,255,0.14)_inset,0_4px_8px_rgba(0,0,0,0.12),0_10px_24px_rgba(10,124,66,0.3)] hover:scale-[0.99] active:scale-[0.98]"
        >
          {checkingSession ? 'Vérification session...' : loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#718096]">
        <Link href="/" className="text-totem-accent hover:text-totem-accent-hover">
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </motion.div>
  );
}
