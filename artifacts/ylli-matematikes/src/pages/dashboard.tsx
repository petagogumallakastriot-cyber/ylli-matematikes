import { Link } from 'wouter';
import { useGetDashboard, useGetGrades, useGetProfile } from '@workspace/api-client-react';
import { useT } from '@/lib/i18n';
import { gradeTitle, translateLessonTitle } from '@/lib/curriculum-i18n';
import { ArrowRight, Target, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBox, GuestBanner } from '@/components/shell';
import { Avatar, Mascot, Stars, gradeColor } from '@/lib/theme';
import { greetName } from '@/lib/greet';

function Ring({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.min(1, value / max) : 0;
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
      <circle cx="50" cy="50" r={r} stroke="#ffffff22" strokeWidth="10" fill="none" />
      <circle cx="50" cy="50" r={r} stroke="#ffc533" strokeWidth="10" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

export default function Dashboard() {
  const dash = useGetDashboard();
  const grades = useGetGrades();
  const prof = useGetProfile();
  const d = dash.data;
  const { t, lang, locale } = useT();
  const p = prof.data?.profile;

  return (
    <div className="space-y-8">
      <section className="rise relative overflow-hidden rounded-[2rem] bg-[#1f2a5c] p-6 text-[#fff8e6] md:p-10">
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-90"><Mascot size={170} className="twinkle" /></div>
        <p className="font-bold uppercase tracking-[0.2em] text-[#ffc533] text-xs">
          {p ? t('dash.kickerBack') : t('dash.kickerNew')}
        </p>
        {p && <p className="mt-2 font-display text-3xl font-semibold md:text-4xl" data-testid="text-greeting">{t('hello', { n: greetName(p) })}</p>}
        <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
          {t('dash.title')}
        </h1>
        {dash.isLoading ? <Skeleton className="mt-8 h-14 w-64 bg-white/10" /> : d && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={`/mesim/${d.nextGrade}/${d.nextLesson}`} data-testid="link-continue"
              className="chunky inline-flex items-center gap-2 rounded-full bg-[#ffc533] px-7 py-4 font-display text-lg font-semibold text-[#1f2a5c]">
              {d.completedLessons > 0 ? t('dash.continue') : t('dash.startFirst')} <ArrowRight className="h-5 w-5" />
            </Link>
            <span className="text-sm text-white/70">{t('dash.gradeLesson', { g: d.nextGrade, l: d.nextLesson })}</span>
          </div>
        )}
      </section>

      {dash.isError && <ErrorBox onRetry={() => dash.refetch()} />}

        {prof.data && prof.data.authenticated && !p && (
          <Link href="/regjistrimi" className="flex items-center gap-4 rounded-3xl border-2 border-[#1f2a5c] bg-[#fff1d9] p-5" data-testid="link-create-learner">
            <Avatar kind="fox" size={56} />
            <div className="flex-1"><p className="font-display text-xl font-semibold">{t('dash.createTitle')}</p><p className="text-sm text-muted-foreground">{t('dash.createBody')}</p></div>
            <ArrowRight />
          </Link>
        )}
      <GuestBanner text={t('dash.guest')} />

      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
        {dash.isLoading || !d ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />) : (
          <>
            <div className="flex items-center gap-5 rounded-3xl bg-[#36457f] p-5 text-white" data-testid="card-daily-goal">
              <div className="relative"><Ring value={d.dailyCompleted} max={d.dailyGoal} />
                <div className="absolute inset-0 grid place-items-center font-display text-2xl font-semibold tab-num">{d.dailyCompleted}/{d.dailyGoal}</div></div>
              <div><p className="flex items-center gap-2 font-bold text-[#ffc533]"><Target className="h-4 w-4" />{t('dash.goal')}</p>
                <p className="mt-1 text-sm text-white/75">{d.dailyCompleted >= d.dailyGoal ? t('dash.goalDone') : t('dash.goalLeft', { n: d.dailyGoal - d.dailyCompleted })}</p></div>
            </div>
            <div className="rounded-3xl border-2 border-border bg-card p-5" data-testid="card-lessons-done">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <p className="mt-3 font-display text-4xl font-semibold tab-num">{d.completedLessons}<span className="text-lg text-muted-foreground">/{d.totalLessons}</span></p>
              <p className="text-sm text-muted-foreground">{t('dash.lessonsDone')}</p>
              <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-accent" style={{ width: `${(d.completedLessons / Math.max(1, d.totalLessons)) * 100}%` }} /></div>
            </div>
            <div className="rounded-3xl border-2 border-border bg-card p-5" data-testid="card-accuracy">
              <Sparkles className="h-6 w-6 text-[#d99a00]" />
              <p className="mt-3 font-display text-4xl font-semibold tab-num">{Math.round(d.accuracy)}%</p>
              <p className="text-sm text-muted-foreground">{t('dash.accuracy')}</p>
            </div>
          </>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold">{t('dash.journey')}</h2>
          <Link href="/klasat" className="text-sm font-bold text-primary underline-offset-4 hover:underline" data-testid="link-all-grades">{t('common.all')}</Link>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3">
          {grades.isLoading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-56 shrink-0 rounded-3xl" />)}
          {grades.isError && <ErrorBox onRetry={() => grades.refetch()} />}
          {grades.data?.map((g) => {
            const c = gradeColor(g.grade);
            return (
              <Link key={g.grade} href={`/klasa/${g.grade}`} data-testid={`card-grade-${g.grade}`}
                className="group w-56 shrink-0 snap-start rounded-3xl p-5 transition-transform hover:-translate-y-1" style={{ background: c.bg, color: c.ink }}>
                <p className="font-display text-6xl font-semibold leading-none">{g.grade}</p>
                <p className="mt-2 font-display text-lg font-semibold leading-tight">{gradeTitle(g.grade, lang, g.title)}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-bold"><span>{g.completedLessons}/{g.totalLessons}</span><Stars value={Math.min(3, Math.floor(g.stars / Math.max(1, g.totalLessons)))} size={14} /></div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><Clock className="h-5 w-5" />{t('dash.recent')}</h2>
        {d && d.recentActivity.length === 0 && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-muted p-5">
            <Mascot size={56} />
            <p className="text-sm text-muted-foreground">{t('dash.empty')}</p>
          </div>
        )}
        <ul className="mt-4 divide-y divide-border">
          {d?.recentActivity.map((a, i) => (
            <li key={i} className="flex items-center gap-3 py-3" data-testid={`row-activity-${i}`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl font-display font-semibold" style={{ background: gradeColor(a.grade).bg, color: gradeColor(a.grade).ink }}>{a.grade}</span>
              <div className="flex-1"><p className="font-bold">{translateLessonTitle(a.title, a.grade, lang)}</p><p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString(locale)}</p></div>
              <Stars value={a.stars} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
