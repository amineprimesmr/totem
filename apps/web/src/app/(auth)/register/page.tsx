'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RegisterPage() {
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

      <h1 className="text-2xl font-bold text-[#2d3748] mb-2">Inscription désactivée</h1>
      <p className="text-[#718096] mb-6 text-sm">
        Le logiciel Totem est un outil interne staff-only.
        <strong className="block mt-2 text-[#2d3748]">Les comptes sont créés uniquement par un administrateur Totem.</strong>
      </p>
      <p className="text-sm text-[#718096] mb-6">
        Contactez l&apos;administration Totem Formation pour l&apos;ouverture d&apos;un accès.
      </p>

      <Link
        href="/login"
        className="block w-full py-3.5 rounded-xl font-semibold text-center text-white bg-totem-accent hover:bg-totem-accent-hover transition-all shadow-[0_-1px_0_rgba(255,255,255,0.12)_inset,0_2px_4px_rgba(0,0,0,0.15),0_6px_16px_rgba(10,124,66,0.25)] hover:shadow-[0_-1px_0_rgba(255,255,255,0.14)_inset,0_4px_8px_rgba(0,0,0,0.12),0_10px_24px_rgba(10,124,66,0.3)]"
      >
        Retour à la connexion
      </Link>
    </motion.div>
  );
}
