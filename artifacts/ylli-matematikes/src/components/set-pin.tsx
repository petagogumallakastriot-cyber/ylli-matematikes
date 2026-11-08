import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSetLearnerPin, getGetProfileQueryKey, type Profile } from '@workspace/api-client-react';
import { KeyRound } from 'lucide-react';
import { PinField, PIN_RE } from '@/components/pin-field';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { apiErrorKey } from '@/lib/api-error';

export function SetPinCard({ profile, onDone }: { profile: Profile; onDone?: () => void }) {
  const { t } = useT();
  const qc = useQueryClient();
  const { toast } = useToast();
  const setPinM = useSetLearnerPin();
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true); setError('');
    if (!PIN_RE.test(pin) || pin !== pin2) return;
    setPinM.mutate({ data: { pin } }, {
      onSuccess: (np) => {
        setPin(''); setPin2('');
        qc.setQueryData(getGetProfileQueryKey(), { authenticated: true, profile: np });
        toast({ title: t('setpin.toast', { nick: np.nickname }) });
        onDone?.();
      },
      onError: (err) => setError(t(apiErrorKey(err))),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="rise space-y-4 rounded-[2rem] border-2 border-[#1f2a5c] bg-[#fff1d9] p-6" data-testid="card-set-pin">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#d99a00]"><KeyRound className="h-4 w-4" />{t('setpin.kicker')}</p>
      <h2 className="font-display text-2xl font-semibold">{t('setpin.title')}</h2>
      <p className="text-sm text-[#56608a]">{t('setpin.body', { nick: profile.nickname })}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <PinField label={t('field.pin')} value={pin} onChange={setPin} autoComplete="new-password" error={touched && !PIN_RE.test(pin) && t('err.pinFormat')} testId="input-set-pin" />
        <PinField label={t('field.pin2')} value={pin2} onChange={setPin2} autoComplete="new-password" error={touched && pin2 !== pin && t('err.pinMatch')} testId="input-set-pin-confirm" />
      </div>
      <p className="rounded-2xl bg-white/60 p-3 text-xs font-semibold text-[#5a4300]">{t('pin.keep')}</p>
      {error && <p className="rounded-2xl bg-[#ffe4e0] p-3 text-sm font-bold text-[#5c1610]" role="alert">{error}</p>}
      <button type="submit" disabled={setPinM.isPending} data-testid="button-set-pin"
        className="chunky w-full rounded-full bg-[#1f2a5c] py-4 font-display text-lg font-semibold text-white disabled:opacity-60">
        {setPinM.isPending ? t('save.pending') : t('setpin.submit')}
      </button>
    </form>
  );
}
