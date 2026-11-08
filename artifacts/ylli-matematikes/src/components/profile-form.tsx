import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUpdateProfile, useRegisterLearner, getGetProfileQueryKey, getGetDashboardQueryKey, getGetLeaderboardQueryKey,
  type Profile, type ProfileInputAvatar, type ProfileInputGender, type ProfileState,
} from '@workspace/api-client-react';
import { Lock, Globe, KeyRound } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AVATARS, Avatar, gradeColor } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { apiErrorKey, errorCode } from '@/lib/api-error';
import { PinField, PIN_RE } from '@/components/pin-field';

const field = 'mt-1 w-full rounded-2xl border-2 border-input bg-background px-4 py-3 font-semibold outline-none focus:border-[#1f2a5c]';
export type FormMode = 'register' | 'onboarding' | 'edit';

export function ProfileForm({ profile, mode, onSaved, onRegistered, onAvatarChange }: {
  profile: Profile | null | undefined; mode: FormMode;
  onSaved?: (p: Profile) => void; onRegistered?: (s: ProfileState) => void;
  onAvatarChange?: (a: ProfileInputAvatar, g: number) => void;
}) {
  const { t, lang } = useT();
  const update = useUpdateProfile();
  const register = useRegisterLearner();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<ProfileInputGender | null>(null);
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState(1);
  const [avatar, setAvatar] = useState<ProfileInputAvatar>('fox');
  const [publicRanking, setPublicRanking] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [nickTaken, setNickTaken] = useState(false);
  const [formError, setFormError] = useState('');
  const [initFor, setInitFor] = useState<string | null>(null);

  useEffect(() => {
    if (profile && initFor !== profile.id) {
      setInitFor(profile.id);
      setFirstName(profile.firstName ?? ''); setLastName(profile.lastName ?? '');
      setAge(profile.age != null ? String(profile.age) : '');
      setGender(profile.gender ?? null);
      setNickname(profile.nickname); setGrade(profile.grade);
      setAvatar((AVATARS as readonly string[]).includes(profile.avatar) ? (profile.avatar as ProfileInputAvatar) : 'fox');
      setPublicRanking(profile.publicRanking);
    }
  }, [profile, initFor]);

  const cbRef = useRef(onAvatarChange);
  cbRef.current = onAvatarChange;
  useEffect(() => { cbRef.current?.(avatar, grade); }, [avatar, grade]);

  const isRegister = mode === 'register';
  const ageNum = Number(age);
  const errors = {
    firstName: firstName.trim().length < 1 || firstName.trim().length > 50,
    lastName: lastName.trim().length < 1 || lastName.trim().length > 50,
    age: !/^\d+$/.test(age) || ageNum < 4 || ageNum > 18,
    gender: !gender,
    nickname: nickname.trim().length < 2 || nickname.trim().length > 24,
    pin: isRegister && !PIN_RE.test(pin),
    pin2: isRegister && pin2 !== pin,
  };
  const valid = !Object.values(errors).some(Boolean);
  const [touched, setTouched] = useState(false);
  const pending = update.isPending || register.isPending;

  const save = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true); setFormError('');
    if (!valid || !gender) return;
    const base = {
      firstName: firstName.trim(), lastName: lastName.trim(), age: ageNum, gender, language: lang,
      nickname: nickname.trim(), grade, avatar, publicRanking,
    };
    const onError = (err: unknown) => {
      if (errorCode(err) === 'NICKNAME_TAKEN' || (err as { status?: number })?.status === 409) setNickTaken(true);
      const msg = t(apiErrorKey(err));
      setFormError(msg);
      toast({ title: t('toast.saveFail'), description: msg, variant: 'destructive' });
    };
    if (isRegister) {
      register.mutate({ data: { ...base, pin } }, {
        onSuccess: (state) => {
          setPin(''); setPin2('');
          toast({ title: t('toast.welcome', { n: state.profile?.firstName ?? base.firstName }) });
          onRegistered?.(state);
        },
        onError,
      });
      return;
    }
    update.mutate({ data: base }, {
      onSuccess: (np) => {
        qc.setQueryData(getGetProfileQueryKey(), { authenticated: true, profile: np });
        qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        qc.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        toast({ title: mode === 'onboarding' ? t('toast.welcome', { n: np.firstName }) : t('toast.saved', { n: np.firstName }) });
        onSaved?.(np);
      },
      onError,
    });
  };

  const err = (k: keyof typeof errors) => touched && errors[k];

  return (
    <form onSubmit={save} noValidate className="rise space-y-6 rounded-[2rem] border-2 border-border bg-card p-6">
      <h2 className="font-display text-2xl font-semibold">{t(isRegister ? 'form.titleRegister' : mode === 'onboarding' ? 'form.titleOnboarding' : 'form.titleEdit')}</h2>

      <fieldset className="space-y-4 rounded-3xl bg-[#fff1d9] p-4">
        <legend className="flex items-center gap-2 px-1 text-sm font-extrabold text-[#1f2a5c]"><Lock className="h-4 w-4" />{t('form.private')}</legend>
        <p className="text-xs text-[#56608a]">{t('form.privateNote')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-sm font-bold">{t('field.first')}</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} autoComplete="given-name" className={field} aria-invalid={err('firstName')} data-testid="input-first-name" />
            {err('firstName') && <span className="text-xs font-bold text-destructive">{t('err.first')}</span>}
          </label>
          <label className="block"><span className="text-sm font-bold">{t('field.last')}</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} autoComplete="family-name" className={field} aria-invalid={err('lastName')} data-testid="input-last-name" />
            {err('lastName') && <span className="text-xs font-bold text-destructive">{t('err.last')}</span>}
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <label className="block"><span className="text-sm font-bold">{t('field.age')}</span>
            <input value={age} onChange={(e) => { if (/^\d{0,2}$/.test(e.target.value)) setAge(e.target.value); }} inputMode="numeric" className={field} aria-invalid={err('age')} data-testid="input-age" />
            {err('age') && <span className="text-xs font-bold text-destructive">{t('err.age')}</span>}
          </label>
          <div role="radiogroup" aria-label={t('field.gender')}>
            <span className="text-sm font-bold">{t('field.gender')}</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(['female', 'male'] as const).map((g) => (
                <button type="button" key={g} role="radio" aria-checked={gender === g} onClick={() => setGender(g)} data-testid={`button-gender-${g}`}
                  className={cn('rounded-2xl border-2 py-3 font-bold transition-transform hover:-translate-y-0.5',
                    gender === g ? 'border-[#1f2a5c] bg-[#1f2a5c] text-white' : 'border-input bg-background')}>
                  {t(`gender.${g}`)}
                </button>
              ))}
            </div>
            {err('gender') && <span className="text-xs font-bold text-destructive">{t('err.gender')}</span>}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-extrabold"><Globe className="h-4 w-4" />{t('form.public')}</legend>
        <label className="block">
          <span className="text-sm font-bold">{t('field.nickname')}</span>
          <input value={nickname} onChange={(e) => { setNickname(e.target.value); setNickTaken(false); }} maxLength={24} placeholder={t('nick.placeholder')}
            autoComplete="username" className={field} aria-invalid={err('nickname') || nickTaken} data-testid="input-nickname" />
          <span className={cn('text-xs', err('nickname') || nickTaken ? 'font-bold text-destructive' : 'text-muted-foreground')}>
            {nickTaken ? t('api.nickTaken') : t(isRegister ? 'nick.helpRegister' : 'nick.help')}
          </span>
        </label>
        <div>
          <span className="text-sm font-bold">{t('field.avatar')}</span>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {AVATARS.map((a) => (
              <button type="button" key={a} onClick={() => setAvatar(a)} data-testid={`button-avatar-${a}`} aria-pressed={avatar === a}
                className={cn('flex flex-col items-center rounded-2xl border-2 p-2 transition-transform hover:-translate-y-0.5', avatar === a ? 'border-[#1f2a5c] bg-[#fff1d9]' : 'border-transparent bg-muted')}>
                <Avatar kind={a} size={48} /><span className="text-[11px] font-bold">{t(`avatar.${a}`)}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-bold">{t('field.grade')}</span>
          <div className="mt-2 grid grid-cols-9 gap-1.5">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((g) => (
              <button type="button" key={g} onClick={() => setGrade(g)} data-testid={`button-grade-${g}`} aria-pressed={grade === g} aria-label={t('grade.n', { g })}
                className="aspect-square rounded-xl font-display text-lg font-semibold transition-transform hover:-translate-y-0.5"
                style={grade === g ? { background: gradeColor(g).bg, color: gradeColor(g).ink } : { background: 'hsl(var(--muted))' }}>{g}</button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-2xl bg-muted p-4">
          <span><span className="block text-sm font-bold">{t('ranking.title')}</span><span className="text-xs text-muted-foreground">{t('ranking.help')}</span></span>
          <Switch checked={publicRanking} onCheckedChange={setPublicRanking} aria-label={t('ranking.title')} data-testid="switch-public-ranking" />
        </label>
      </fieldset>

      {isRegister && (
        <fieldset className="space-y-4 rounded-3xl border-2 border-dashed border-[#1f2a5c]/30 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-extrabold"><KeyRound className="h-4 w-4" />{t('pin.legend')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <PinField label={t('field.pin')} value={pin} onChange={setPin} autoComplete="new-password" error={err('pin') && t('err.pinFormat')} testId="input-pin" />
            <PinField label={t('field.pin2')} value={pin2} onChange={setPin2} autoComplete="new-password" error={err('pin2') && t('err.pinMatch')} testId="input-pin-confirm" />
          </div>
          <p className="rounded-2xl bg-[#fff1d9] p-3 text-xs font-semibold text-[#5a4300]">{t('pin.keep')}</p>
        </fieldset>
      )}

      {formError && <p className="rounded-2xl bg-[#ffe4e0] p-3 text-sm font-bold text-[#5c1610]" role="alert" data-testid="text-form-error">{formError}</p>}

      <button type="submit" disabled={pending} data-testid="button-save-profile"
        className="chunky w-full rounded-full bg-[#ffc533] py-4 font-display text-lg font-semibold text-[#1f2a5c] disabled:opacity-50">
        {pending ? t('save.pending') : t(isRegister ? 'save.register' : mode === 'onboarding' ? 'save.start' : 'save.edit')}
      </button>
    </form>
  );
}
