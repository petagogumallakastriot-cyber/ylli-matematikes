import { useRef, useState } from 'react';
import { useT } from '@/lib/i18n';

/** Each place keeps its own digit; entering units first must not shift them. */
export function ColumnAnswer({ places, onChange }: {
  places: number;
  onChange: (value: string) => void;
}) {
  const { t } = useT();
  const [digits, setDigits] = useState<string[]>(() => Array(places).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const update = (next: string[]) => {
    setDigits(next);
    const value = next.join('').replace(/^0+(?=\d)/, '');
    const first = next.findIndex(Boolean);
    // Do not submit an answer with an unfilled place between its digits.
    onChange(first < 0 || next.slice(first).some((digit) => !digit) ? '' : value);
  };
  return (
    <div className="flex" role="group" aria-label={t('column.group')} style={{ fontSize: places >= 5 ? 24 : 30 }}>
      {digits.map((digit, index) => (
        <input key={index} ref={(el) => { refs.current[index] = el; }}
          autoFocus={index === places - 1} type="text" inputMode="numeric"
          autoComplete="off" value={digit}
          aria-label={index === places - 1 ? t('column.ones') : t('column.col', { n: places - index })}
          data-testid={`input-answer-column-${places - index}`}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            if (!/^\d*$/.test(e.target.value)) return;
            const next = [...digits];
            next[index] = e.target.value.slice(-1);
            update(next);
            if (next[index] && index > 0) {
              refs.current[index - 1]?.focus();
              refs.current[index - 1]?.select();
            }
          }}
          onKeyDown={(e) => {
            const target = e.key === 'ArrowLeft' ? index - 1
              : e.key === 'ArrowRight' ? index + 1
              : e.key === 'Backspace' && !digit ? index + 1 : null;
            if (target !== null && target >= 0 && target < places) {
              e.preventDefault();
              if (e.key === 'Backspace') {
                const next = [...digits]; next[target] = ''; update(next);
              }
              refs.current[target]?.focus();
              refs.current[target]?.select();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').trim();
            if (!/^\d+$/.test(pasted) || pasted.length > places) return;
            update([...Array(places - pasted.length).fill(''), ...pasted]);
          }}
          className="h-11 w-[1.25em] min-w-0 rounded border border-dashed border-[#1f2a5c] bg-white p-0 text-center font-mono text-[1em] font-semibold outline-none focus:border-solid focus:ring-2 focus:ring-[#ffc533]"
        />
      ))}
    </div>
  );
}

export function answerPlaces(a: number, b: number, op: string): number | null {
  if (a < 0 || b < 0 || !Number.isInteger(a) || !Number.isInteger(b)) return null;
  const width = Math.max(String(a).length, String(b).length);
  if (op === '+') return width + 1;
  if (op === '-' && a >= b) return width;
  if (['*', '×', 'x'].includes(op)) return String(a).length + String(b).length;
  return null;
}
