import { Link } from 'wouter';
import { ArrowRight, Star, Heart, Lock } from 'lucide-react';
import { Mascot, gradeColor } from '@/lib/theme';
import { LanguageSwitcher, useT } from '@/lib/i18n';

const FLOAT = [
  { t: '7 + 5', g: 1, x: '6%', y: '18%', r: -8 },
  { t: '36 ÷ 4', g: 4, x: '82%', y: '14%', r: 6 },
  { t: '8 × 7', g: 3, x: '86%', y: '64%', r: -5 },
  { t: '120 − 45', g: 6, x: '4%', y: '70%', r: 7 },
];

export default function WelcomePage() {
  const { t } = useT();
  const features = [
    { i: Star, c: '#d99a00', t: t('welcome.f1t'), d: t('welcome.f1d') },
    { i: Heart, c: '#ff7a6b', t: t('welcome.f2t'), d: t('welcome.f2d') },
    { i: Lock, c: '#3fbfa3', t: t('welcome.f3t'), d: t('welcome.f3d') },
  ];
  return (
    <div className="paper relative flex min-h-[100dvh] flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-5 sm:px-5">
        <Mascot size={36} className="twinkle" />
        <span className="hidden font-display text-xl font-semibold text-[#1f2a5c] min-[440px]:inline">Ylli i <span className="text-[#d99a00]">Matematikës</span></span>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/sign-in" className="rounded-full px-3 py-2 text-sm font-bold text-[#1f2a5c] hover:bg-[#1f2a5c]/5" data-testid="link-header-signin">{t('header.signin')}</Link>
        </div>
      </header>

      {FLOAT.map((f) => (
        <span key={f.t} aria-hidden className="pointer-events-none absolute hidden rounded-2xl px-4 py-2 font-display text-2xl font-semibold shadow-[0_4px_0_0_#1f2a5c] md:block"
          style={{ left: f.x, top: f.y, transform: `rotate(${f.r}deg)`, background: gradeColor(f.g).bg, color: gradeColor(f.g).ink }}>{f.t}</span>
      ))}

      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
        <div className="rise relative">
          <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-[#ffc533]/30 blur-2xl" />
          <Mascot size={150} className="twinkle" />
        </div>
        <p className="rise mt-6 text-xs font-extrabold uppercase tracking-[0.25em] text-[#d99a00]">{t('welcome.kicker')}</p>
        <h1 className="rise mt-3 font-display text-5xl font-semibold leading-[1.02] text-[#1f2a5c] md:text-7xl">
          {t('welcome.title1')}<br />{t('welcome.title2')}
        </h1>
        <p className="rise mx-auto mt-5 max-w-xl text-lg text-[#56608a]">{t('welcome.body')}</p>

        <div className="rise mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Link href="/sign-in" data-testid="link-welcome-signin"
            className="chunky flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1f2a5c] px-8 py-4 font-display text-xl font-semibold text-[#fff8e6]">
            {t('header.signin')}
          </Link>
          <Link href="/sign-up" data-testid="link-welcome-signup"
            className="chunky flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ffc533] px-8 py-4 font-display text-xl font-semibold text-[#1f2a5c]">
            {t('header.signup')} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <Link href="/klasat" className="mt-5 text-sm font-bold text-[#56608a] underline underline-offset-4 hover:text-[#1f2a5c]" data-testid="link-welcome-guest">
          {t('welcome.guest')}
        </Link>

        <div className="rise mt-12 grid w-full gap-3 text-left sm:grid-cols-3">
          {features.map((f, k) => (
            <div key={k} className="rounded-3xl border-2 border-[#1f2a5c]/10 bg-[#fffdf6] p-4" style={{ transform: `rotate(${k === 1 ? 0 : k === 0 ? -1 : 1}deg)` }}>
              <f.i className="h-5 w-5" style={{ color: f.c }} aria-hidden />
              <p className="mt-2 font-display text-lg font-semibold text-[#1f2a5c]">{f.t}</p>
              <p className="text-sm text-[#56608a]">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
