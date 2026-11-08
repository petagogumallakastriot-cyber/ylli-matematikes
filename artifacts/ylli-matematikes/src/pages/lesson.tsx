import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetLesson, getGetLessonQueryKey, useStartSession, useSubmitAnswer,
  getGetDashboardQueryKey, getGetProfileQueryKey, getGetGradesQueryKey, getGetLessonsQueryKey, getGetLeaderboardQueryKey,
  useGetProfile, type PracticeSession, type AnswerResult, type TableRow,
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Heart, RotateCcw, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBox, GuestBanner } from '@/components/shell';
import { Mascot, Stars, gradeColor, prettyOp } from '@/lib/theme';
import { useT } from '@/lib/i18n';
import { lessonTitle, lessonDescription, lessonIntro, exercisePrompt, feedbackMessage } from '@/lib/curriculum-i18n';
import { cn } from '@/lib/utils';
import { greetName, pickLine, renderLine, type LineRef } from '@/lib/greet';
import { ColumnAnswer, answerPlaces } from '@/components/column-answer';

type Answered = Record<number, { given: number; correct: boolean; correctAnswer: number }>;

function TeachingTable({ rows, color }: { rows: TableRow[]; color: ReturnType<typeof gradeColor> }) {
  const groups = useMemo(() => {
    const m = new Map<number, TableRow[]>();
    rows.forEach((r) => {
      const key = r.operator === '*' || r.operator === '×' || r.operator === 'x' ? r.a : r.b;
      m.set(key, [...(m.get(key) ?? []), r]);
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [rows]);
  const [sel, setSel] = useState<number | null>(null);
  const { t } = useT();
  const active = groups.find(([k]) => k === sel) ?? groups[0];
  if (!active) return null;
  return (
    <div className="rounded-3xl border-2 border-border bg-card p-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('lesson.tableTitle')}>
        {groups.map(([k]) => (
          <button key={k} onClick={() => setSel(k)} data-testid={`button-table-factor-${k}`} aria-pressed={active[0] === k}
            className={cn('h-10 w-10 rounded-xl font-display text-lg font-semibold transition-transform hover:-translate-y-0.5',
              active[0] === k ? 'text-white' : 'bg-muted')} style={active[0] === k ? { background: color.bg, color: color.ink } : undefined}>{k}</button>
        ))}
      </div>
      <div key={active[0]} className="popin mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {active[1].map((r, i) => (
          <div key={i} className="rounded-2xl px-3 py-2 text-center font-display text-lg font-medium tab-num" style={{ background: color.soft, color: color.ink }}>
            {r.a} {prettyOp(r.operator)} {r.b} = <b>{r.result}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalProblem({ a, b, op, state, answer, children }: {
  a: number; b: number; op: string; state: 'current' | 'done-ok' | 'done-bad' | 'pending'; answer?: ReactNode; children?: ReactNode;
}) {
  const places = answerPlaces(a, b, op);
  const operand = (value: number) => places ? (
    <span className="flex justify-end font-mono" style={{ fontSize: places >= 5 ? 24 : 30 }}>
      {String(value).split('').map((digit, i) => <span key={i} className="w-[1.25em] text-center">{digit}</span>)}
    </span>
  ) : value;
  return (
    <div className={cn('flex flex-col items-end rounded-2xl px-3 py-3 font-display tab-num transition-all',
      state === 'current' && 'bg-[#fff1d9] ring-4 ring-[#ffc533] scale-[1.04]',
      state === 'pending' && 'opacity-45',
      state === 'done-ok' && 'bg-[#dcf6ef]', state === 'done-bad' && 'bg-[#ffe4e0]')}>
      <span className="text-right text-3xl font-medium leading-tight">{operand(a)}</span>
      <span className="relative flex w-full items-center justify-end text-3xl font-medium leading-tight">
        <span className="absolute left-0 text-2xl text-[#ff7a6b]">{prettyOp(op)}</span><span>{operand(b)}</span>
      </span>
      <span className="my-1 h-[3px] w-full rounded-full bg-[#1f2a5c]" />
      <div className="min-h-[2.4rem] text-3xl font-semibold">{children ?? answer}</div>
    </div>
  );
}

export default function LessonPage() {
  const params = useParams<{ grade: string; lesson: string }>();
  const grade = Number(params.grade), lessonId = Number(params.lesson);
  const valid = grade >= 1 && grade <= 9 && lessonId >= 1 && lessonId <= 15;
  const qc = useQueryClient();
  const detail = useGetLesson(grade, lessonId, { query: { enabled: valid, queryKey: getGetLessonQueryKey(grade, lessonId) } });
  const start = useStartSession();
  const submit = useSubmitAnswer();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [answered, setAnswered] = useState<Answered>({});
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [input, setInput] = useState('');
  const [tableSeen, setTableSeen] = useState(false);
  const [earned, setEarned] = useState({ xp: 0, hearts: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const name = greetName(useGetProfile().data?.profile);
  const { t, lang } = useT();
  const [cheer, setCheer] = useState<LineRef | null>(null);
  const [endLine, setEndLine] = useState<LineRef | null>(null);
  const c = gradeColor(valid ? grade : 1);

  useEffect(() => {
    setSession(null); setAnswered({}); setFeedback(null); setInput(''); setTableSeen(false);
    setEarned({ xp: 0, hearts: 0 });
  }, [grade, lessonId]);

  if (!valid) return <ErrorBox text={t('lesson.notExist')} onRetry={() => history.back()} />;

  const begin = () => {
    setFeedback(null); setAnswered({}); setInput(''); setEarned({ xp: 0, hearts: 0 });
    start.mutate({ data: { grade, lesson: lessonId } }, {
      onSuccess: (s) => { setSession(s); setTimeout(() => inputRef.current?.focus(), 50); },
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!session || feedback || input.trim() === '' || submit.isPending) return;
    const idx = session.answeredCount;
    const val = Number(input.replace(',', '.'));
    if (!Number.isFinite(val)) return;
    submit.mutate({ id: session.id, data: { exerciseId: idx, answer: val } }, {
      onSuccess: (r) => {
        setAnswered((p) => ({ ...p, [idx]: { given: val, correct: r.correct, correctAnswer: r.correctAnswer } }));
        setFeedback(r);
        setCheer(pickLine(r.correct ? 'correct' : 'wrong'));
        if (r.session.status === 'completed') setEndLine(pickLine(r.session.stars === 3 ? 'complete3' : 'complete'));
        else if (r.session.status === 'failed') setEndLine(pickLine('retry'));
        setEarned({ xp: r.earnedXp, hearts: r.earnedHearts });
        if (r.session.status !== 'active') {
          [getGetDashboardQueryKey(), getGetProfileQueryKey(), getGetGradesQueryKey(), getGetLessonsQueryKey(grade), getGetLessonQueryKey(grade, lessonId), getGetLeaderboardQueryKey()]
            .forEach((k) => qc.invalidateQueries({ queryKey: k }));
        }
      },
    });
  };

  const advance = () => {
    if (!feedback) return;
    setSession(feedback.session); setFeedback(null); setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const d = detail.data;
  const lesson = d?.lesson;
  const needsTable = !!d && d.table.length > 0;
  const finished = session && !feedback && session.status !== 'active' ? session : null;
  const viewSession = feedback?.session ?? session;

  return (
    <div className="space-y-6">
      <Link href={`/klasa/${grade}`} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground" data-testid="link-back-grade"><ArrowLeft className="h-4 w-4" />{t('grade.n', { g: grade })}</Link>
      {detail.isError && <ErrorBox onRetry={() => detail.refetch()} />}
      {detail.isLoading && <Skeleton className="h-48 rounded-[2rem]" />}

      {lesson && (
        <header className="rise flex flex-col gap-4 rounded-[2rem] p-6 md:flex-row md:items-center" style={{ background: c.bg, color: c.ink }}>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em]">{t('lesson.meta', { g: grade, l: lessonId, op: t(`op.${lesson.operation}`) })}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold">{lessonTitle(grade, lessonId, lang)}</h1>
            <p className="mt-1 font-semibold opacity-85">{lessonDescription(lesson.operation, lesson.hasTable, lang)}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/40 px-4 py-3">
            <span className="text-xs font-bold">{t('lesson.best')}</span><Stars value={lesson.stars} size={22} />
          </div>
        </header>
      )}

      {d && !session && (
        <section className="space-y-5">
          <div className="flex gap-4 rounded-3xl border-2 border-border bg-card p-5">
            <Mascot size={64} className="shrink-0" />
            <p className="whitespace-pre-line text-lg leading-relaxed">{lessonIntro(d.lesson.operation, d.lesson.hasTable, lang)}</p>
          </div>
          {needsTable && (
            <>
              <h2 className="font-display text-2xl font-semibold">{t('lesson.tableTitle')}</h2>
              <TeachingTable rows={d.table} color={c} />
            </>
          )}
          <GuestBanner text={t('lesson.guest')} />
          <div className="flex flex-wrap items-center gap-4">
            {needsTable && !tableSeen ? (
              <button onClick={() => setTableSeen(true)} data-testid="button-table-understood"
                className="chunky inline-flex items-center gap-2 rounded-full bg-[#1f2a5c] px-7 py-4 font-display text-lg font-semibold text-white">
                {t('lesson.tableDone')} <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button onClick={begin} disabled={start.isPending} data-testid="button-start-practice"
                className="chunky inline-flex items-center gap-2 rounded-full bg-[#ffc533] px-7 py-4 font-display text-lg font-semibold text-[#1f2a5c] disabled:opacity-60">
                {start.isPending ? t('lesson.preparing') : t('lesson.start', { n: lesson?.exerciseCount ?? 12 })} <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <span className="text-sm text-muted-foreground">{t('lesson.livesNote')}</span>
          </div>
          {start.isError && <p className="text-sm font-bold text-destructive">{t('lesson.startErr')}</p>}
        </section>
      )}

      {viewSession && !finished && (
        <section className="space-y-4">
          <div className="sticky top-16 z-30 flex items-center gap-4 rounded-2xl bg-card/95 p-3 shadow-sm backdrop-blur">
            <div className="flex gap-1" data-testid="status-lives" role="img" aria-label={t('lesson.livesLabel', { n: viewSession.lives })}>
              {[0, 1, 2].map((i) => <Heart key={i} className={cn('h-6 w-6 transition-transform', i < viewSession.lives ? 'fill-[#ff7a6b] text-[#ff7a6b]' : 'text-muted-foreground/40 scale-75')} />)}
            </div>
            <div className="h-3 flex-1 rounded-full bg-muted">
              <div className="h-3 rounded-full bg-accent transition-all duration-500" style={{ width: `${(viewSession.answeredCount / viewSession.totalQuestions) * 100}%` }} />
            </div>
            <span className="font-display font-semibold tab-num" data-testid="text-progress" aria-label={t('lesson.progressLabel', { a: viewSession.answeredCount, b: viewSession.totalQuestions })}>{viewSession.answeredCount}/{viewSession.totalQuestions}</span>
          </div>

          {session && (() => {
            const ex = session.exercises[session.answeredCount];
            return ex && (
              <div className="rounded-3xl bg-[#1f2a5c] p-4 text-center font-semibold text-[#fff8e6]" data-testid="text-prompt">{exercisePrompt(ex.operator, lang)}</div>
            );
          })()}

          <div className="rounded-[2rem] border-2 border-border bg-[#fffdf6] p-4 md:p-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 min-[440px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {session?.exercises.map((ex, i) => {
                const a = answered[i];
                const isCur = i === session.answeredCount && !feedback;
                const st = a ? (a.correct ? 'done-ok' : 'done-bad') : isCur ? 'current' : 'pending';
                const places = answerPlaces(ex.a, ex.b, ex.operator);
                return (
                  <div key={ex.id} className={cn(a && !a.correct && feedback && i === session.answeredCount && 'shake')} data-testid={`card-exercise-${i}`}>
                    <VerticalProblem a={ex.a} b={ex.b} op={ex.operator} state={st}
                      answer={a ? (
                        <span className="flex items-center gap-2">
                          {a.correct ? <span className="text-[#0b7a5f]">{a.given}</span> : <><s className="text-lg text-[#c0392b]">{a.given}</s><span className="text-[#0b7a5f]">{a.correctAnswer}</span></>}
                        </span>) : undefined}>
                      {isCur ? (
                        <form onSubmit={onSubmit}>
                          {places ? <ColumnAnswer key={`${session.id}-${ex.id}`} places={places} onChange={setInput} /> : <input ref={inputRef} inputMode={grade >= 8 ? 'decimal' : 'text'} value={input} autoFocus
                            onChange={(e) => { if (/^-?\d*(?:[.,]\d*)?$/.test(e.target.value)) setInput(e.target.value); }} data-testid="input-answer"
                            className="w-24 rounded-lg border-2 border-dashed border-[#1f2a5c] bg-white px-2 text-right text-3xl font-semibold outline-none focus:border-solid" aria-label={t('lesson.answerLabel')} />}
                        </form>
                      ) : undefined}
                    </VerticalProblem>
                  </div>
                );
              })}
            </div>
          </div>

          {!feedback && session && answerPlaces(session.exercises[session.answeredCount]?.a, session.exercises[session.answeredCount]?.b, session.exercises[session.answeredCount]?.operator) && (
            <p className="text-sm font-bold text-muted-foreground">{t('lesson.columnHint')}</p>
          )}
          {!feedback && (
            <button onClick={onSubmit} disabled={!input || submit.isPending} data-testid="button-check"
              className="chunky w-full rounded-full bg-[#ffc533] py-4 font-display text-xl font-semibold text-[#1f2a5c] disabled:opacity-50 md:w-auto md:px-12">
              {submit.isPending ? t('lesson.checking') : t('lesson.check')}
            </button>
          )}
          {submit.isError && <p className="text-sm font-bold text-destructive">{t('lesson.submitErr')}</p>}

          {feedback && (
            <div className={cn('popin flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center', feedback.correct ? 'bg-[#3fbfa3] text-[#06372c]' : 'bg-[#ff7a6b] text-[#4a0f09]')} data-testid="status-feedback" role="status" aria-live="polite">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/50">{feedback.correct ? <Check aria-hidden /> : <X aria-hidden />}</span>
              <div className="flex-1">
                <p className="font-display text-2xl font-semibold">{cheer ? renderLine(cheer, name, lang) : ''}</p>
                {!feedback.correct && feedback.session.status !== 'active' && <p className="font-bold">{t('lesson.correctIs', { n: feedback.correctAnswer })}</p>}
                <p className="font-semibold">{feedbackMessage(feedback, lang)}</p>
              </div>
              <button onClick={advance} autoFocus data-testid="button-next"
                className="chunky rounded-full bg-[#1f2a5c] px-6 py-3 font-bold text-white">{feedback.session.status === 'active' ? t('lesson.next') : t('lesson.seeResult')}</button>
            </div>
          )}
        </section>
      )}

      {finished && (
        <section className="popin rounded-[2rem] bg-[#1f2a5c] p-8 text-center text-[#fff8e6]" data-testid="card-result" role="status" aria-live="polite">
          <Mascot size={110} className={finished.status === 'completed' ? 'twinkle mx-auto' : 'mx-auto grayscale-[60%]'} />
          <h2 className="mt-3 font-display text-4xl font-semibold">{finished.status === 'completed' ? (name ? t('lesson.congrats', { n: name }) : t('lesson.done')) : t('lesson.outOfLives')}</h2>
          <p className="mt-2 text-white/75">
            {renderLine(endLine ?? (finished.status === 'completed' ? { kind: finished.stars === 3 ? 'complete3' : 'complete', i: 0 } : { kind: 'retry', i: 0 }), name, lang)}
          </p>
          <Stars value={finished.stars} size={44} className="mt-4 justify-center text-white" />
          <p className="mt-3 text-sm tab-num">{t('lesson.correctOf', { a: finished.correctCount, b: finished.totalQuestions })}</p>
          {!finished.guest && finished.status === 'completed' && (
            <p className="mt-3 font-bold text-[#ffc533]">{earned.xp > 0 ? t('lesson.earned', { xp: earned.xp, h: earned.hearts }) : t('lesson.bestSaved')}</p>
          )}
          {finished.guest && (
            <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-white/10 p-3 text-sm">{t('lesson.guestNotSaved')} <Link href="/sign-up" className="font-bold text-[#ffc533] underline" data-testid="link-result-signup">{t('lesson.createAccount')}</Link> {t('lesson.toKeep')}</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={begin} disabled={start.isPending} data-testid="button-retry-lesson" className="chunky inline-flex items-center gap-2 rounded-full bg-[#ffc533] px-6 py-3 font-bold text-[#1f2a5c]"><RotateCcw className="h-4 w-4" />{t('common.retry')}</button>
            {finished.status === 'completed' && lessonId < 15 ? (
              <Link href={`/mesim/${grade}/${lessonId + 1}`} onClick={() => { setSession(null); setTableSeen(false); }} data-testid="link-next-lesson" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-bold">{t('lesson.nextLesson')} <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <Link href="/klasat" data-testid="link-grades-after" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-bold">{t('nav.grades')} <ArrowRight className="h-4 w-4" /></Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
