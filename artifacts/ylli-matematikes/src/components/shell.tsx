import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetProfile } from '@workspace/api-client-react';
import { Home, BookOpen, Trophy, UserRound, LogOut, Heart, Flame } from 'lucide-react';
import { Avatar, Mascot } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { greetName } from '@/lib/greet';
import { LanguageSwitcher, useT } from '@/lib/i18n';
import { useSignOut } from '@/lib/session';
import type { Key } from '@/lib/dict';
import type { ErrorFallbackProps } from '@/components/error-boundary';

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const NAV: { href: string; label: Key; id: string; icon: typeof Home }[] = [
  { href: '/', label: 'nav.home', id: 'home', icon: Home },
  { href: '/klasat', label: 'nav.grades', id: 'grades', icon: BookOpen },
  { href: '/gara', label: 'nav.race', id: 'race', icon: Trophy },
  { href: '/profili', label: 'nav.profile', id: 'profile', icon: UserRound },
];

function isActive(loc: string, href: string) {
  if (href === '/') return loc === '/';
  if (href === '/klasat') return loc.startsWith('/klas') || loc.startsWith('/mesim');
  return loc.startsWith(href);
}

export function useAuthState() {
  const prof = useGetProfile();
  return { prof, authenticated: !!prof.data?.authenticated, profile: prof.data?.profile ?? null };
}

function UserChip() {
  const { t } = useT();
  const { profile: p } = useAuthState();
  const { signOut, pending } = useSignOut();
  return (
    <div className="flex items-center gap-2">
      {p && greetName(p) && <span className="hidden text-sm font-bold text-white/85 lg:block" data-testid="text-header-greeting">{t('header.hi', { n: greetName(p) })}</span>}
      {p && (
        <div className="hidden sm:flex items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold" data-testid="text-header-stats">
          <span className="flex items-center gap-1" title={t('stat.hearts')}><Heart className="h-4 w-4 fill-[#ff7a6b] text-[#ff7a6b]" aria-hidden />{p.hearts}<span className="sr-only">{t('stat.hearts')}</span></span>
          <span className="flex items-center gap-1" title={t('stat.streak')}><Flame className="h-4 w-4 text-[#ffc533]" aria-hidden />{p.streak}<span className="sr-only">{t('stat.streak')}</span></span>
        </div>
      )}
      <Link href="/profili" className="rounded-full bg-[#fff3cf] p-0.5" aria-label={t('header.profileLink')} data-testid="link-avatar">
        <Avatar kind={p?.avatar} size={34} />
      </Link>
      <button type="button" onClick={() => signOut()} disabled={pending}
        className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white" title={t('header.logout')} aria-label={t('header.logout')} data-testid="button-logout">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const { t } = useT();
  const { authenticated, prof } = useAuthState();
  return (
    <div className="paper min-h-[100dvh] pb-24 md:pb-0">
      <header className="sticky top-0 z-40 bg-[#1f2a5c] text-[#fff8e6]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Ylli i Matematikës" data-testid="link-home-logo">
            <Mascot size={36} className="twinkle" />
            <span className="hidden font-display text-xl font-semibold leading-none min-[520px]:inline">Ylli i <span className="text-[#ffc533]">Matematikës</span></span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label={t('nav.main')}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.id}`}
                className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  isActive(loc, n.href) ? 'bg-[#ffc533] text-[#1f2a5c]' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
                <n.icon className="h-4 w-4" />{t(n.label)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher tone="dark" />
            {authenticated ? <UserChip /> : !prof.isLoading && (
              <div className="flex items-center gap-1">
                <Link href="/sign-in" className="hidden rounded-full px-3 py-2 text-sm font-bold text-white/80 hover:text-white sm:block" data-testid="link-sign-in">{t('header.signin')}</Link>
                <Link href="/sign-up" className="rounded-full bg-[#ffc533] px-3 py-2 text-sm font-extrabold text-[#1f2a5c]" data-testid="link-sign-up">{t('header.signup')}</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl bg-[#1f2a5c] p-1.5 shadow-xl md:hidden" aria-label={t('nav.main')}>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} data-testid={`link-mobile-${n.id}`}
            className={cn('flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-bold',
              isActive(loc, n.href) ? 'bg-[#ffc533] text-[#1f2a5c]' : 'text-white/70')}>
            <n.icon className="h-5 w-5" />{t(n.label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function ErrorBox({ onRetry, text }: { onRetry: () => void; text?: string }) {
  const { t } = useT();
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#ff7a6b] bg-[#ffe4e0] p-8 text-center" role="alert">
      <p className="font-display text-xl text-[#5c1610]">{text ?? t('common.error')}</p>
      <button onClick={onRetry} className="chunky mt-4 rounded-full bg-[#1f2a5c] px-6 py-2 font-bold text-white" data-testid="button-retry">{t('common.retry')}</button>
    </div>
  );
}

export function RouteErrorFallback({ resetError }: ErrorFallbackProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center py-12 text-center" role="alert">
      <Mascot size={96} className="grayscale-[50%]" />
      <h1 className="mt-4 font-display text-3xl font-semibold">{t('err.boundaryTitle')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('err.boundaryText')}</p>
      <button onClick={resetError} className="chunky mt-5 rounded-full bg-[#ffc533] px-6 py-3 font-bold text-[#1f2a5c]" data-testid="button-error-retry">{t('common.retry')}</button>
    </div>
  );
}

export function GuestBanner({ text }: { text: string }) {
  const { t } = useT();
  const { prof, authenticated } = useAuthState();
  if (prof.isLoading || authenticated) return null;
  return (
    <div className="flex flex-col items-start gap-3 rounded-3xl bg-[#1f2a5c] p-4 text-[#fff8e6] sm:flex-row sm:items-center">
      <Mascot size={44} />
      <p className="flex-1 text-sm font-semibold">{text}</p>
      <Link href="/sign-up" className="rounded-full bg-[#ffc533] px-4 py-2 text-sm font-extrabold text-[#1f2a5c]" data-testid="link-guest-signup">{t('guest.save')}</Link>
    </div>
  );
}
