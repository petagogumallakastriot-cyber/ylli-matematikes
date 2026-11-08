import { Link, useParams } from 'wouter';
import { useGetGrades, useGetLessons, getGetLessonsQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, Table2, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBox, GuestBanner } from '@/components/shell';
import { OP_SYMBOL, Stars, gradeColor } from '@/lib/theme';
import { useT } from '@/lib/i18n';
import { gradeTitle, gradeDescription, gradeTopics, lessonTitle, lessonDescription, difficultyLabel } from '@/lib/curriculum-i18n';

export function GradesPage() {
  const { data, isLoading, isError, refetch } = useGetGrades();
  const { t, lang } = useT();
  return (
    <div className="space-y-6">
      <div className="rise">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{t('grades.kicker')}</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">{t('grades.title')}</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">{t('grades.body')}</p>
      </div>
      {isError && <ErrorBox onRetry={() => refetch()} />}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem]" />)}
        {data?.map((g, i) => {
          const c = gradeColor(g.grade);
          const pct = (g.completedLessons / Math.max(1, g.totalLessons)) * 100;
          return (
            <Link key={g.grade} href={`/klasa/${g.grade}`} data-testid={`card-grade-${g.grade}`}
              className={`rise group relative overflow-hidden rounded-[2rem] p-6 transition-transform hover:-translate-y-1 hover:rotate-[-0.6deg] ${i === 0 ? 'lg:col-span-2' : ''}`}
              style={{ background: c.bg, color: c.ink, animationDelay: `${i * 50}ms` }}>
              <span className="pointer-events-none absolute -bottom-8 -right-2 font-display text-[11rem] font-semibold leading-none opacity-20">{g.grade}</span>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-80">{t('grades.gradeColor', { g: g.grade, c: t(`color.${(g.grade - 1) % 9 + 1}` as 'color.1') })}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">{gradeTitle(g.grade, lang, g.title)}</h2>
              <p className="mt-2 max-w-sm text-sm font-semibold opacity-85">{gradeDescription(g.grade, lang, g.description)}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {gradeTopics(g.grade, lang, g.topics).slice(0, 4).map((t) => <span key={t} className="rounded-full bg-white/35 px-2.5 py-1 text-xs font-bold">{t}</span>)}
              </div>
              <div className="relative mt-5">
                <div className="h-2 rounded-full bg-black/10"><div className="h-2 rounded-full bg-current" style={{ width: `${pct}%` }} /></div>
                <p className="mt-2 text-xs font-bold">{t('grades.progress', { a: g.completedLessons, b: g.totalLessons, s: g.stars })}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function GradePage() {
  const params = useParams<{ grade: string }>();
  const grade = Number(params.grade);
  const valid = grade >= 1 && grade <= 9;
  const grades = useGetGrades();
  const lessons = useGetLessons(grade, { query: { enabled: valid, queryKey: getGetLessonsQueryKey(grade) } });
  const g = grades.data?.find((x) => x.grade === grade);
  const c = gradeColor(valid ? grade : 1);
  const { t, lang } = useT();

  if (!valid) return <ErrorBox text={t('grades.notExist')} onRetry={() => history.back()} />;

  return (
    <div className="space-y-6">
      <Link href="/klasat" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground" data-testid="link-back-grades"><ArrowLeft className="h-4 w-4" />{t('nav.grades')}</Link>
      <header className="rise relative overflow-hidden rounded-[2rem] p-6 md:p-8" style={{ background: c.bg, color: c.ink }}>
        <span className="pointer-events-none absolute -right-4 -top-10 font-display text-[12rem] font-semibold leading-none opacity-20">{grade}</span>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]">{t('grade.n', { g: grade })}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">{g ? gradeTitle(grade, lang, g.title) : <Skeleton className="h-10 w-60 bg-white/30" />}</h1>
        <p className="mt-2 max-w-xl font-semibold opacity-85">{g ? gradeDescription(grade, lang, g.description) : ''}</p>
      </header>
      <GuestBanner text={t('grades.guest')} />
      {lessons.isError && <ErrorBox onRetry={() => lessons.refetch()} />}
      <ol className="relative grid gap-3 md:grid-cols-2">
        {lessons.isLoading && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        {lessons.data?.map((l, i) => (
          <li key={l.id} className="rise" style={{ animationDelay: `${i * 30}ms` }}>
            <Link href={`/mesim/${grade}/${l.id}`} data-testid={`card-lesson-${l.id}`}
              className="group flex h-full items-center gap-4 rounded-3xl border-2 border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-[#1f2a5c]">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-3xl font-semibold"
                style={{ background: l.completed ? c.bg : c.soft, color: c.ink }}>
                {OP_SYMBOL[l.operation] ?? '+'}
                {l.completed && <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-white"><Check className="h-4 w-4" /></span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground">{t('grades.lessonMeta', { n: l.id, op: t(`op.${l.operation}`), d: difficultyLabel(l.difficulty, lang) })}</p>
                <p className="font-display text-lg font-semibold leading-tight">{lessonTitle(grade, l.id, lang)}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{lessonDescription(l.operation, l.hasTable, lang)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Stars value={l.stars} size={16} />
                {l.hasTable && <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold"><Table2 className="h-3 w-3" />{t('grades.table')}</span>}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
