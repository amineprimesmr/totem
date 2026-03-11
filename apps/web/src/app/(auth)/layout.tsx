import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-outfit bg-[#fafafa] text-[#1a1a1a]">
      {/* Header — barre flottante style Fidelity (auth) */}
      <div className="sticky top-0 z-[100] bg-black border-b border-white/10">
        <header className="max-w-[1280px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link href="/" aria-label="Accueil Totem" className="flex items-center">
            <BrandLogo width={156} height={42} className="h-auto w-auto max-h-10" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-white/80 hover:text-white transition-colors">
              Accueil
            </Link>
            <Link href="/login" className="text-sm font-semibold text-white">
              Se connecter
            </Link>
          </nav>
        </header>
      </div>

      <main className="max-w-[1280px] mx-auto px-5 py-12 flex justify-center items-start min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-[480px] flex-shrink-0">{children}</div>
      </main>
    </div>
  );
}
