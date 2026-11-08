import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLegacyClerk } from '@/lib/legacy-clerk';
import { useDeleteProfile, type ProfileInputAvatar } from '@workspace/api-client-react';
import { Heart, Star, Flame, Zap, BookCheck, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ErrorBox, useAuthState } from '@/components/shell';
import { ProfileForm } from '@/components/profile-form';
import { SetPinCard } from '@/components/set-pin';
import { PinField, PIN_RE } from '@/components/pin-field';
import { useToast } from '@/hooks/use-toast';
import { Avatar, Mascot } from '@/lib/theme';
import { greetName } from '@/lib/greet';
import { useT } from '@/lib/i18n';
import { useIdentity, useSignOut } from '@/lib/session';
import { apiErrorKey } from '@/lib/api-error';

function DeleteAccount({ hasPin }: { hasPin: boolean }) {
  const { t } = useT();
  const del = useDeleteProfile();
  const clerk = useLegacyClerk();
  const { resetIdentity } = useIdentity();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const confirm = () => {
    setError('');
    if (!PIN_RE.test(pin)) { setError(t('err.pinFormat')); return; }
    del.mutate({ data: { pin } }, {
      onSuccess: async () => {
        setOpen(false); setPin('');
        try { if (clerk?.user) await clerk.signOut(); } catch { /* ignore */ }
        await resetIdentity({ authenticated: false, profile: null });
        toast({ title: t('delete.done') });
        setLocation('/');
      },
      onError: (err) => { setPin(''); setError(t(apiErrorKey(err))); },
    });
  };

  return (
    <div className="rounded-3xl border-2 border-dashed border-[#ff7a6b] bg-[#ffe4e0]/60 p-5">
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-[#5c1610]"><AlertTriangle className="h-5 w-5" />{t('delete.title')}</p>
      <p className="mt-1 text-sm text-[#5c1610]/80">{t('delete.body')}</p>
      {!hasPin && <p className="mt-2 text-xs font-bold text-[#5c1610]">{t('delete.needPin')}</p>}
      <button type="button" disabled={!hasPin} onClick={() => { setOpen(true); setError(''); setPin(''); }} data-testid="button-open-delete"
        className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-[#d9453a] px-5 py-2 text-sm font-extrabold text-[#a52a20] hover:bg-[#d9453a] hover:text-white disabled:opacity-40">
        <Trash2 className="h-4 w-4" />{t('delete.open')}
      </button>
      <AlertDialog open={open} onOpenChange={(o) => { if (!del.isPending) setOpen(o); }}>
        <AlertDialogContent className="rounded-[2rem] border-2 border-[#1f2a5c] bg-[#fffdf6]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">{t('delete.dialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="rounded-2xl bg-[#ffe4e0] p-3 text-sm font-semibold text-[#5c1610]">{t('delete.warn')}</AlertDialogDescription>
          </AlertDialogHeader>
          <PinField label={t('delete.pinLabel')} value={pin} onChange={setPin} error={error} testId="input-delete-pin" autoFocus />
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full" data-testid="button-cancel-delete">{t('delete.cancel')}</AlertDialogCancel>
            <button type="button" onClick={confirm} disabled={del.isPending} data-testid="button-confirm-delete"
              className="rounded-full bg-[#d9453a] px-5 py-2 text-sm font-extrabold text-white disabled:opacity-60">
              {del.isPending ? t('delete.pending') : t('delete.confirm')}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useT();
  const { prof, authenticated, profile: p } = useAuthState();
  const { signOut, pending } = useSignOut();
  const [preview, setPreview] = useState<{ a: ProfileInputAvatar; g: number } | null>(null);

  if (prof.isLoading) return <Skeleton className="h-96 rounded-[2rem]" />;
  if (prof.isError) return <ErrorBox onRetry={() => prof.refetch()} />;
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] bg-[#1f2a5c] p-8 text-center text-[#fff8e6]">
        <Mascot size={110} className="twinkle mx-auto" />
        <h1 className="mt-4 font-display text-4xl font-semibold">{t('profile.guestTitle')}</h1>
        <p className="mt-2 text-white/75">{t('profile.guestBody')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/sign-in" className="chunky rounded-full bg-[#ffc533] px-6 py-3 font-bold text-[#1f2a5c]" data-testid="link-profile-signin">{t('header.signin')}</Link>
          <Link href="/sign-up" className="rounded-full bg-white/15 px-6 py-3 font-bold" data-testid="link-profile-signup">{t('header.signup')}</Link>
        </div>
      </div>
    );
  }

  const name = greetName(p);
  const stats = p ? [
    { id: 'stars', icon: Star, label: t('stat.stars'), v: p.stars, c: '#d99a00' },
    { id: 'hearts', icon: Heart, label: t('stat.hearts'), v: p.hearts, c: '#ff7a6b' },
    { id: 'xp', icon: Zap, label: 'XP', v: p.xp, c: '#5b8def' },
    { id: 'lessons', icon: BookCheck, label: t('stat.lessons'), v: p.completedLessons, c: '#3fbfa3' },
    { id: 'streak', icon: Flame, label: t('stat.streak'), v: p.streak, c: '#f08a3c' },
  ] : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-5">
        <section className="rise h-fit rounded-[2rem] bg-[#1f2a5c] p-6 text-[#fff8e6]">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#fff3cf] p-1"><Avatar kind={preview?.a ?? p?.avatar} size={88} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffc533]">{p ? t('profile.level', { n: p.level }) : t('profile.newLearner')}</p>
              <h1 className="font-display text-3xl font-semibold" data-testid="text-greeting">{name ? t('hello', { n: name }) : t('helloPlain')}</h1>
              <p className="text-sm text-white/70">{p ? `${t('profile.inRace', { n: p.nickname })} · ` : ''}{t('grade.n', { g: preview?.g ?? p?.grade ?? 1 })}</p>
            </div>
          </div>
          {p && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-white/10 p-3" data-testid={`stat-${s.id}`}>
                    <s.icon className="h-5 w-5" style={{ color: s.c }} aria-hidden />
                    <p className="mt-1 font-display text-2xl font-semibold tab-num">{s.v}</p>
                    <p className="text-xs text-white/65">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-xs text-white/70"><span>{t('profile.toLevel', { n: p.level + 1 })}</span><span className="tab-num">{t('profile.heartsOf', { a: p.hearts % 30 })}</span></div>
                <div className="mt-1 h-2 rounded-full bg-white/15"><div className="h-2 rounded-full bg-[#ffc533]" style={{ width: `${((p.hearts % 30) / 30) * 100}%` }} /></div>
              </div>
            </>
          )}
        </section>
        <section className="rise space-y-4 rounded-[2rem] border-2 border-border bg-card p-6">
          <h2 className="font-display text-2xl font-semibold">{t('account.title')}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => signOut()} disabled={pending} data-testid="button-profile-logout"
              className="chunky inline-flex items-center gap-2 rounded-full bg-[#1f2a5c] px-5 py-3 font-bold text-white disabled:opacity-60">
              <LogOut className="h-4 w-4" />{t('account.logout')}
            </button>
            <span className="text-xs text-muted-foreground">{t('account.logoutHint')}</span>
          </div>
          <DeleteAccount hasPin={!!p?.hasPin} />
        </section>
      </div>
      <div className="space-y-5">
        {p && !p.hasPin && <SetPinCard profile={p} />}
        <ProfileForm profile={p} mode={p ? 'edit' : 'onboarding'} onAvatarChange={(a, g) => setPreview({ a, g })} />
      </div>
    </div>
  );
}
