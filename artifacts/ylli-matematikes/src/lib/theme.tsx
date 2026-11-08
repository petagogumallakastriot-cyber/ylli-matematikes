import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export const GRADE_COLORS: { bg: string; ink: string; soft: string; name: string }[] = [
  { bg: '#ffb84d', ink: '#6b3a00', soft: '#fff1d9', name: 'Agimi' },
  { bg: '#ff7a6b', ink: '#5c1610', soft: '#ffe4e0', name: 'Shega' },
  { bg: '#3fbfa3', ink: '#0b4337', soft: '#dcf6ef', name: 'Bregu' },
  { bg: '#5b8def', ink: '#122c63', soft: '#e1eafd', name: 'Liqeni' },
  { bg: '#b07ce8', ink: '#3b1866', soft: '#f1e6fc', name: 'Livando' },
  { bg: '#f2c94c', ink: '#5a4300', soft: '#fdf5d6', name: 'Gruri' },
  { bg: '#ef6fa6', ink: '#5e0f33', soft: '#fde1ee', name: 'Trëndafili' },
  { bg: '#2fa8c9', ink: '#073b4a', soft: '#d9f1f8', name: 'Deti' },
  { bg: '#36457f', ink: '#ffffff', soft: '#e3e6f4', name: 'Nata' },
];
export const gradeColor = (g: number) => GRADE_COLORS[(g - 1) % 9] ?? GRADE_COLORS[0];

export const OP_SYMBOL: Record<string, string> = {
  compare: '>', addition: '+', subtraction: '−', multiplication: '×', division: '÷', mixed: '±',
};
export const prettyOp = (op: string) =>
  ({ '-': '−', '*': '×', x: '×', '/': '÷', ':': '÷' } as Record<string, string>)[op] ?? op;

export const AVATARS = ['fox', 'bear', 'rabbit', 'cat', 'owl', 'panda'] as const;
export type AvatarKey = (typeof AVATARS)[number];
const AV: Record<string, { fill: string; face: string; ear: 'pointy' | 'round' | 'long' | 'tuft' }> = {
  fox: { fill: '#f08a3c', face: '#fff3e3', ear: 'pointy' },
  bear: { fill: '#a0704a', face: '#f3dcc4', ear: 'round' },
  rabbit: { fill: '#d9d3e8', face: '#ffffff', ear: 'long' },
  cat: { fill: '#8c95a8', face: '#eef0f5', ear: 'pointy' },
  owl: { fill: '#7a5c9e', face: '#f6e7c8', ear: 'tuft' },
  panda: { fill: '#2b2f3a', face: '#ffffff', ear: 'round' },
};

export function Avatar({ kind, size = 48, className }: { kind?: string | null; size?: number; className?: string }) {
  const { t } = useT();
  const key = (AVATARS as readonly string[]).includes(kind ?? '') ? (kind as AvatarKey) : 'fox';
  const a = AV[kind ?? ''] ?? AV.fox;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={t(`avatar.${key}`)}>
      {a.ear === 'pointy' && (<><path d="M12 30 L16 6 L30 20Z" fill={a.fill} /><path d="M52 30 L48 6 L34 20Z" fill={a.fill} /></>)}
      {a.ear === 'round' && (<><circle cx="15" cy="16" r="9" fill={a.fill} /><circle cx="49" cy="16" r="9" fill={a.fill} /></>)}
      {a.ear === 'long' && (<><ellipse cx="22" cy="12" rx="6" ry="14" fill={a.fill} /><ellipse cx="42" cy="12" rx="6" ry="14" fill={a.fill} /><ellipse cx="22" cy="13" rx="2.5" ry="9" fill="#f6b8c8" /><ellipse cx="42" cy="13" rx="2.5" ry="9" fill="#f6b8c8" /></>)}
      {a.ear === 'tuft' && (<><path d="M14 22 L12 8 L26 16Z" fill={a.fill} /><path d="M50 22 L52 8 L38 16Z" fill={a.fill} /></>)}
      <circle cx="32" cy="36" r="24" fill={a.fill} />
      <ellipse cx="32" cy="42" rx="16" ry="13" fill={a.face} />
      {kind === 'panda' && (<><ellipse cx="23" cy="33" rx="6" ry="7" fill="#2b2f3a" /><ellipse cx="41" cy="33" rx="6" ry="7" fill="#2b2f3a" /></>)}
      {kind === 'owl' && (<><circle cx="23" cy="33" r="8" fill="#fff" /><circle cx="41" cy="33" r="8" fill="#fff" /></>)}
      <circle cx="23" cy="33" r="3" fill={kind === 'panda' ? '#fff' : '#1f2a5c'} />
      <circle cx="41" cy="33" r="3" fill={kind === 'panda' ? '#fff' : '#1f2a5c'} />
      {kind === 'owl' ? <path d="M29 40 L35 40 L32 46Z" fill="#f2a93b" /> : <ellipse cx="32" cy="42" rx="3.2" ry="2.4" fill="#1f2a5c" />}
      <path d="M27 47 Q32 51 37 47" stroke="#1f2a5c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="43" r="3" fill="#ff8f8f" opacity=".45" />
      <circle cx="46" cy="43" r="3" fill="#ff8f8f" opacity=".45" />
    </svg>
  );
}

export function Stars({ value, max = 3, size = 18, className }: { value: number; max?: number; size?: number; className?: string }) {
  const { t } = useT();
  return (
    <div className={cn('flex items-center gap-0.5', className)} role="img" aria-label={t('stars.aria', { v: value, m: max })}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} width={size} height={size} strokeWidth={2.2}
          className={i < value ? 'fill-[#ffc533] text-[#d99a00]' : 'fill-transparent text-current opacity-30'} />
      ))}
    </div>
  );
}

export function Mascot({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      <path d="M60 8 L74 40 L110 44 L83 68 L91 104 L60 86 L29 104 L37 68 L10 44 L46 40Z" fill="#ffc533" stroke="#1f2a5c" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="50" cy="58" r="5" fill="#1f2a5c" /><circle cx="70" cy="58" r="5" fill="#1f2a5c" />
      <circle cx="52" cy="56" r="1.6" fill="#fff" /><circle cx="72" cy="56" r="1.6" fill="#fff" />
      <path d="M50 70 Q60 79 70 70" stroke="#1f2a5c" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="68" r="4" fill="#ff8f6b" opacity=".6" /><circle cx="78" cy="68" r="4" fill="#ff8f6b" opacity=".6" />
    </svg>
  );
}
