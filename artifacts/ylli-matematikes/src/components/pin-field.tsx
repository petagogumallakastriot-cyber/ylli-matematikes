import { KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PIN_RE = /^\d{6}$/;

export function PinField({ label, value, onChange, error, testId, autoComplete = 'current-password', autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; error?: string | false; testId: string;
  autoComplete?: 'current-password' | 'new-password'; autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <span className="relative mt-1 block">
        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete={autoComplete} autoFocus={autoFocus}
          value={value} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); onChange(v); }}
          aria-invalid={!!error} data-testid={testId}
          className={cn('w-full rounded-2xl border-2 bg-background py-3 pl-11 pr-4 font-mono text-xl tracking-[0.5em] outline-none focus:border-[#1f2a5c]',
            error ? 'border-destructive' : 'border-input')} />
      </span>
      {error && <span className="text-xs font-bold text-destructive">{error}</span>}
    </label>
  );
}
