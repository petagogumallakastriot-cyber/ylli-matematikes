import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Redirect, useLocation } from 'wouter';
import { SignIn, useClerk } from '@clerk/react';
import { pinOnly } from '@/lib/legacy-clerk';
import { useLoginLearner, type ProfileState } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileForm } from '@/components/profile-form';
import { PinField, PIN_RE } from '@/components/pin-field';
import { useAuthState, basePath } from '@/components/shell';
import { Mascot } from '@/lib/theme';
import { LanguageSwitcher, useT } from '@/lib/i18n';
import { useIdentity, enableLegacySession } from '@/lib/session';
import { apiErrorKey } from '@/lib/api-error';
import { cn } from '@/lib/utils';

export function AuthFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = useT();
  return (
    <div className="paper flex min-h-[100dvh] flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Ylli i Matematikës" data-testid="link-auth-home">
          <Mascot size={34} className="twinkle" />
          <span className="hidden font-display text-lg font-semibold text-[#1f2a5c] min-[440px]:inline">Ylli i <span className="text-[#d99a00]">Matematikës</span></span>
        </Link>
        <LanguageSwitcher className="ml-auto" />
      </header>
      <main className={cn('mx-auto flex w-full flex-1 flex-col items-center justify-center gap-5 px-4 pb-12', wide ? 'max-w-3xl' : 'max-w-md')}>
        <p className="rise text-center font-display text-lg font-semibold text-[#1f2a5c]">{t('auth.frameLine')}</p>
        {children}
      </main>
    </div>
  );
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { prof, authenticated } = useAuthState();
  if (prof.isLoading) return <AuthFrame><Skeleton className="h-96 w-full rounded-[2rem]" /></AuthFrame>;
  if (authenticated) return <Redirect to="/" replace />;
  return <>{children}</>;
}

const card = 'rise w-full rounded-[2rem] border-2 border-[#1f2a5c] bg-[#fffdf6] p-6 shadow-[0_8px_0_0_#1f2a5c] sm:p-8';

function PinSignInForm() {
  const { t } = useT();
  const login = useLoginLearner();
  const { resetIdentity } = useIdentity();
  const [, setLocation] = useLocation();
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const nickErr = touched && nickname.trim().length < 2;
  const pinErr = touched && !PIN_RE.test(pin);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true); setError('');
    if (nickname.trim().length < 2 || !PIN_RE.test(pin)) return;
    login.mutate({ data: { nickname: nickname.trim(), pin } }, {
      onSuccess: async (state: ProfileState) => {
        setPin('');
        await resetIdentity(state);
        setLocation('/');
      },
      onError: (err) => { setPin(''); setError(t(apiErrorKey(err))); },
    });
  };

  return (
    <form onSubmit={submit} noValidate className={card}>
      <h1 className="font-display text-3xl font-semibold text-[#1f2a5c]">{t('signin.title')}</h1>
      <p className="mt-1 text-sm text-[#56608a]">{t('signin.sub')}</p>
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-bold">{t('field.nickname')}</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} autoComplete="username" autoFocus
            aria-invalid={nickErr} data-testid="input-login-nickname"
            className={cn('mt-1 w-full rounded-2xl border-2 bg-background px-4 py-3 font-semibold outline-none focus:border-[#1f2a5c]', nickErr ? 'border-destructive' : 'border-input')} />
          {nickErr && <span className="text-xs font-bold text-destructive">{t('err.nickReq')}</span>}
        </label>
        <PinField label={t('field.pin')} value={pin} onChange={setPin} error={pinErr && t('err.pinFormat')} testId="input-login-pin" />
      </div>
      {error && <p className="mt-4 rounded-2xl bg-[#ffe4e0] p-3 text-sm font-bold text-[#5c1610]" role="alert" data-testid="text-login-error">{error}</p>}
      <button type="submit" disabled={login.isPending} data-testid="button-login"
        className="chunky mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#ffc533] py-4 font-display text-lg font-semibold text-[#1f2a5c] disabled:opacity-60">
        {login.isPending ? t('signin.pending') : t('signin.submit')} <ArrowRight className="h-5 w-5" />
      </button>
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#fff1d9] p-3 text-xs font-semibold text-[#5a4300]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t('pin.keep')}</p>
      <p className="mt-5 text-center text-sm text-[#56608a]">{t('signin.noAccount')} <Link href="/sign-up" className="font-extrabold text-[#1f2a5c] underline" data-testid="link-to-signup">{t('signin.create')}</Link></p>
      {!pinOnly && <p className="mt-2 text-center text-sm text-[#56608a]">{t('signin.legacy')} <Link href="/legacy-sign-in" className="inline-flex items-center gap-1 font-extrabold text-[#1f2a5c] underline" data-testid="link-legacy"><Mail className="h-3.5 w-3.5" />{t('signin.legacyLink')}</Link></p>}
    </form>
  );
}

export function PinSignInPage() {
  return <GuestOnly><AuthFrame><PinSignInForm /></AuthFrame></GuestOnly>;
}

export function RegisterPage() {
  const { t } = useT();
  const { resetIdentity } = useIdentity();
  const [, setLocation] = useLocation();
  return (
    <GuestOnly>
      <AuthFrame wide>
        <div className="rise w-full text-center">
          <h1 className="font-display text-4xl font-semibold text-[#1f2a5c]">{t('signup.title')}</h1>
          <p className="mt-1 text-[#56608a]">{t('signup.sub')}</p>
        </div>
        <div className="w-full">
          <ProfileForm profile={null} mode="register" onRegistered={async (state) => { await resetIdentity(state); setLocation('/'); }} />
        </div>
        <p className="text-sm text-[#56608a]">{t('signup.have')} <Link href="/sign-in" className="font-extrabold text-[#1f2a5c] underline" data-testid="link-to-signin">{t('signup.signin')}</Link></p>
      </AuthFrame>
    </GuestOnly>
  );
}

export function LegacySignInPage() {
  const { t } = useT();
  const clerk = useClerk();
  const { prof, authenticated } = useAuthState();
  const { resetIdentity } = useIdentity();
  const [, setLocation] = useLocation();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (authenticated && !ready) return <Redirect to="/" replace />;

  const prepare = async (keepExisting: boolean) => {
    setBusy(true); setError('');
    try {
      await enableLegacySession();
      if (keepExisting) {
        await resetIdentity();
        setLocation('/');
        return;
      }
      if (clerk.user) await clerk.signOut();
      setReady(true);
    } catch {
      setError(t('api.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame>
      {ready ? (
        <div className="w-full">
          <SignIn routing="path" path={`${basePath}/legacy-sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/`} forceRedirectUrl={`${basePath}/`} />
        </div>
      ) : (
        <div className={card}>
          <Mail className="h-8 w-8 text-[#d99a00]" aria-hidden />
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#1f2a5c]">{t('legacy.title')}</h1>
          <p className="mt-2 text-sm text-[#56608a]">{t('legacy.sub')}</p>
          {prof.isLoading ? <Skeleton className="mt-6 h-14 rounded-full" /> : (
            <div className="mt-6 space-y-3">
              {clerk.user && (
                <button type="button" onClick={() => prepare(true)} disabled={busy} data-testid="button-legacy-continue"
                  className="chunky w-full rounded-full bg-[#1f2a5c] py-4 font-display text-lg font-semibold text-white disabled:opacity-60">
                  {t('legacy.continue', { e: clerk.user.primaryEmailAddress?.emailAddress ?? '' })}
                </button>
              )}
              <button type="button" onClick={() => prepare(false)} disabled={busy} data-testid="button-legacy-start"
                className="chunky w-full rounded-full bg-[#ffc533] py-4 font-display text-lg font-semibold text-[#1f2a5c] disabled:opacity-60">
                {busy ? t('common.loading') : t(clerk.user ? 'legacy.other' : 'legacy.start')}
              </button>
            </div>
          )}
          {error && <p className="mt-4 rounded-2xl bg-[#ffe4e0] p-3 text-sm font-bold text-[#5c1610]" role="alert">{error}</p>}
          <p className="mt-4 text-xs text-[#56608a]">{t('legacy.note')}</p>
        </div>
      )}
      <Link href="/sign-in" className="inline-flex items-center gap-1 text-sm font-bold text-[#56608a] hover:text-[#1f2a5c]" data-testid="link-legacy-back"><ArrowLeft className="h-4 w-4" />{t('legacy.back')}</Link>
    </AuthFrame>
  );
}
