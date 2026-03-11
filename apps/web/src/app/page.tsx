import Link from 'next/link';
import { LandingHeader } from '@/components/landing/LandingHeader';

export default function HomePage() {
  return (
    <div
      id="landing"
      className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-outfit"
    >
      <LandingHeader />

      <main className="relative z-10">
        {/* Hero section — style Fidelity */}
        <section className="pt-12 pb-16 px-5 max-w-4xl mx-auto">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#f0f4f8] border border-[#e2e8f0] text-[#2d3748] font-semibold text-sm mb-8 hover:bg-[#e8ecf2] hover:border-[#cbd5e0] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label="Accéder au tableau de bord"
            >
              <span className="w-2 h-2 rounded-full bg-totem-accent animate-pulse" />
              Accédez au tableau de bord
            </Link>

            <h1 className="font-outfit font-extrabold text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-tight text-[#1a1a1a] mb-4">
              <span className="block">La plateforme qui</span>
              <span className="block">
                connecte <strong className="text-[var(--landing-accent)]">écoles</strong>, candidats et entreprises
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--landing-muted)] mb-8 max-w-xl">
              Gérez vos candidats en alternance, matchez les offres aux profils, et suivez tout le parcours en un seul endroit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-b from-[#2e2e2e] via-[#1a1a1a] to-[#0f0f0f] shadow-[0_2px_0_rgba(255,255,255,0.1)_inset,0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_rgba(255,255,255,0.12)_inset,0_6px_20px_rgba(0,0,0,0.35)] transition-all"
              >
                Connexion équipe Totem
              </Link>
            </div>
            <p className="text-sm text-[var(--landing-muted)] mb-12">
              Logiciel interne Totem Formation : accès réservé au personnel autorisé.
            </p>

            {/* Benefits — style Fidelity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--totem-accent-light)] text-totem-accent mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-1">Candidats</h3>
                <p className="text-sm text-[var(--landing-muted)]">Profil, critères, CV et candidatures</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--totem-accent-light)] text-totem-accent mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-1">Entreprises</h3>
                <p className="text-sm text-[var(--landing-muted)]">Offres et gestion des partenaires</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--totem-accent-light)] text-totem-accent mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-1">Carte & Matching</h3>
                <p className="text-sm text-[var(--landing-muted)]">Visualisation géo et matchs automatiques</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section "C'est quoi ?" */}
        <section id="comment-ca-marche" className="py-16 px-5 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-extrabold text-2xl md:text-3xl text-[#1a1a1a] mb-4">
              C&apos;est quoi Totem ?
            </h2>
            <p className="text-[var(--landing-muted)] mb-6 text-lg">
              Totem est la plateforme de gestion de l&apos;alternance pour les écoles. Elle centralise les candidats,
              les entreprises partenaires et les offres d&apos;alternance. Le matching automatique propose les meilleures
              correspondances aux candidats, et la carte interactive permet de visualiser la géographie des opportunités.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="font-semibold text-totem-accent hover:text-totem-accent-hover">
                Accéder au tableau de bord →
              </Link>
            </div>
          </div>
        </section>

        {/* Section fonctionnalités */}
        <section id="fonctionnalites" className="py-16 px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-extrabold text-2xl md:text-3xl text-[#1a1a1a] mb-8">
              Fonctionnalités
            </h2>
            <ul className="space-y-4 text-[var(--landing-muted)]">
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Tableau de bord avec statistiques en temps réel</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Gestion des candidats (profil, statut, onboarding)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Gestion des entreprises et partenaires</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Offres d&apos;alternance avec matching automatique</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Carte interactive (candidats + entreprises)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Notifications et emails</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-totem-accent mt-0.5">✓</span>
                <span>Gestion centralisée des équipes, étudiants et entreprises</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16 px-5 bg-[#1a1a1a] text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-extrabold text-2xl md:text-3xl mb-4">
              Prêt à gérer vos alternances ?
            </h2>
            <p className="text-white/80 mb-8">
              Connectez-vous ou créez un compte pour accéder à la plateforme.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-[#1a1a1a] bg-white hover:bg-gray-100 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
