import { useState } from 'react';
import { Link } from 'wouter';
import { useGetLeaderboard, getGetLeaderboardQueryKey } from '@workspace/api-client-react';
import { Heart, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBox } from '@/components/shell';
import { Avatar, Mascot, gradeColor } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function LeaderboardPage() {
  const { t } = useT();
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const params = grade ? { grade } : undefined;
  const { data, isLoading, isError, refetch } = useGetLeaderboard(params, { query: { queryKey: getGetLeaderboardQueryKey(params) } });

  return (
    <div className="space-y-6">
      <div className="rise">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"><Trophy className="h-4 w-4" />{t('lb.kicker')}</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">{t('lb.title')}</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">{t('lb.body')}</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button onClick={() => setGrade(undefined)} data-testid="button-filter-all"
          className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-bold', !grade ? 'bg-[#1f2a5c] text-white' : 'bg-card border-2 border-border')}>{t('common.all')}</button>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((g) => (
          <button key={g} onClick={() => setGrade(g)} data-testid={`button-filter-${g}`}
            className="shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold"
            style={grade === g ? { background: gradeColor(g).bg, color: gradeColor(g).ink, borderColor: gradeColor(g).bg } : undefined}>{t('grade.n', { g })}</button>
        ))}
      </div>
      {isError && <ErrorBox onRetry={() => refetch()} />}
      {isLoading && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>}
      {data && data.length === 0 && (
        <div className="flex flex-col items-center rounded-[2rem] border-2 border-dashed border-border bg-card p-10 text-center">
          <Mascot size={96} className="twinkle" />
          <p className="mt-4 font-display text-2xl font-semibold">{t('lb.emptyTitle')}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('lb.emptyBody')}</p>
          <Link href="/profili" className="chunky mt-5 rounded-full bg-[#ffc533] px-6 py-3 font-bold text-[#1f2a5c]" data-testid="link-enable-ranking">{t('lb.goProfile')}</Link>
        </div>
      )}
      {data && data.length > 0 && (
        <ol className="space-y-2">
          {data.map((e) => (
            <li key={`${e.rank}-${e.nickname}`} data-testid={`row-leader-${e.rank}`}
              className={cn('rise flex items-center gap-3 rounded-2xl border-2 bg-card p-3', e.isMe ? 'border-[#ffc533] bg-[#fff1d9]' : 'border-border')}>
              <span className={cn('grid h-10 w-10 place-items-center rounded-full font-display text-lg font-semibold',
                e.rank === 1 ? 'bg-[#ffc533]' : e.rank === 2 ? 'bg-[#d6dbe8]' : e.rank === 3 ? 'bg-[#f0b98a]' : 'bg-muted')}>{e.rank}</span>
              <Avatar kind={e.avatar} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{e.nickname}{e.isMe && <span className="ml-2 rounded-full bg-[#1f2a5c] px-2 py-0.5 text-[10px] text-white">{t('lb.you')}</span>}</p>
                <p className="text-xs text-muted-foreground">{t('lb.meta', { g: e.grade, l: e.level, xp: e.xp })}</p>
              </div>
              <span className="flex items-center gap-1 font-display text-xl font-semibold tab-num"><Heart className="h-5 w-5 fill-[#ff7a6b] text-[#ff7a6b]" aria-hidden />{e.hearts}<span className="sr-only">{t('stat.hearts')}</span></span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
