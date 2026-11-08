import { Redirect, useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBox, useAuthState } from '@/components/shell';
import { ProfileForm } from '@/components/profile-form';
import { SetPinCard } from '@/components/set-pin';
import { Mascot } from '@/lib/theme';
import { useT } from '@/lib/i18n';
import { isProfileComplete } from '@/lib/greet';

export default function OnboardingPage() {
  const { t } = useT();
  const { prof, authenticated, profile: p } = useAuthState();
  const [, setLocation] = useLocation();
  if (prof.isLoading) return <Skeleton className="h-[32rem] rounded-[2rem]" />;
  if (prof.isError) return <ErrorBox onRetry={() => prof.refetch()} />;
  if (!authenticated) return <Redirect to="/" />;
  const returning = !!p && p.xp + p.completedLessons > 0;
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rise h-fit rounded-[2rem] bg-[#1f2a5c] p-8 text-[#fff8e6] lg:sticky lg:top-24">
        <Mascot size={96} className="twinkle" />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ffc533]">{t(returning ? 'onb.kickerReturning' : 'onb.kickerNew')}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{t(returning ? 'onb.titleReturning' : 'onb.titleNew')}</h1>
        <p className="mt-3 text-white/75">{t(returning ? 'onb.bodyReturning' : 'onb.bodyNew')}</p>
        <ul className="mt-6 space-y-2 text-sm text-white/80">
          <li className="rounded-2xl bg-white/10 p-3">{t('onb.li1')}</li>
          <li className="rounded-2xl bg-white/10 p-3">{t('onb.li2')}</li>
          <li className="rounded-2xl bg-white/10 p-3">{t('onb.li3')}</li>
        </ul>
      </section>
      <ProfileForm profile={p} mode="onboarding" onSaved={(np) => setLocation(np.hasPin ? '/' : '/vendos-pin')} />
    </div>
  );
}

export function SetPinPage() {
  const { prof, authenticated, profile: p } = useAuthState();
  const [, setLocation] = useLocation();
  if (prof.isLoading) return <Skeleton className="h-96 rounded-[2rem]" />;
  if (prof.isError) return <ErrorBox onRetry={() => prof.refetch()} />;
  if (!authenticated) return <Redirect to="/" />;
  if (!isProfileComplete(p)) return <Redirect to="/regjistrimi" replace />;
  if (!p || p.hasPin) return <Redirect to="/" replace />;
  return (
    <div className="mx-auto max-w-xl">
      <Mascot size={80} className="twinkle mx-auto mb-4" />
      <SetPinCard profile={p} onDone={() => setLocation('/')} />
    </div>
  );
}
