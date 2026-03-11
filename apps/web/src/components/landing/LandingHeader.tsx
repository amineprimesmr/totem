import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export function LandingHeader() {
  return (
    <div className="sticky top-0 z-[100] px-5 pt-5 pb-2 bg-[#fafafa]">
      <header className="max-w-[880px] mx-auto bg-gradient-to-b from-white via-[#f2f2f2] to-[#ebebeb] rounded-2xl px-4 py-2 border border-white/95 shadow-landing-bar">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Accueil Totem" className="flex items-center">
            <BrandLogo width={170} height={46} />
          </Link>
          <nav className="hidden md:flex flex-1 justify-center gap-8">
            <Link href="#comment-ca-marche" className="font-semibold text-[0.85rem] text-[#2d2d2d] hover:text-[#1a1a1a]">
              C'est quoi ?
            </Link>
            <Link href="#fonctionnalites" className="font-semibold text-[0.85rem] text-[#2d2d2d] hover:text-[#1a1a1a]">
              Fonctionnalités
            </Link>
          </nav>
          <Link
            href="/login"
            className="ml-auto font-semibold text-[0.88rem] px-4 py-2 rounded-xl bg-[#1a1a1a] text-white hover:bg-[#2d2d2d]"
          >
            Se connecter
          </Link>
        </div>
      </header>
    </div>
  );
}
