import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mic, Wand2, Play, Send, SkipForward, Lightbulb, Timer, ArrowRight, CheckCircle2, AlertCircle, Flag, Shuffle, X } from 'lucide-react';
import { Button, Card, PageHeader, Badge, EmptyState, Textarea, Alert, ScoreRing, ProgressBar, RichAnswer, Label, cx } from '../components/ui';
import { useApp, uid } from '../context/AppContext';
import { categoryMeta } from '../lib/constants';
import { api } from '../lib/api';

const LENGTHS = [3, 5, 10];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DimBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-navy-600">{label}</span>
        <span className="font-semibold text-navy-900">{value}/10</span>
      </div>
      <ProgressBar value={value * 10} />
    </div>
  );
}

export function EvaluationView({ ev }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ScoreRing value={ev.score} size={112} label="Score" />
        <div className="w-full flex-1 space-y-3">
          <DimBar label="Clarity" value={ev.clarity} />
          <DimBar label="Relevance" value={ev.relevance} />
          <DimBar label="Confidence" value={ev.confidence} />
          <DimBar label="Structure" value={ev.structure} />
        </div>
      </div>
      <p className="rounded-xl bg-navy-50 p-4 text-[15px] leading-relaxed text-navy-800 ring-1 ring-navy-100">{ev.summary}</p>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> What worked
          </div>
          <ul className="space-y-1.5">
            {ev.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-navy-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" /> Improve
          </div>
          <ul className="space-y-1.5">
            {ev.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-navy-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl bg-brand-soft p-4 ring-1 ring-brand-100">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">Suggested improved answer</div>
        <RichAnswer text={ev.improvedAnswer} className="text-[15px] text-navy-800" />
      </div>
    </div>
  );
}

function fmtTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function MockInterview() {
  const { state, dispatch, toast } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessions = state.sessions;

  const [sessionId, setSessionId] = useState(params.get('session') || sessions[0]?.id || '');
  const [length, setLength] = useState(5);
  const [shuffled, setShuffled] = useState(true);
  const [mock, setMock] = useState(null); // active run
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const textRef = useRef(null);

  const session = useMemo(() => sessions.find((s) => s.id === sessionId), [sessions, sessionId]);
  const current = mock?.questions[idx];

  useEffect(() => {
    if (!mock || evaluation) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [mock, idx, evaluation]);

  useEffect(() => {
    if (mock && !evaluation) textRef.current?.focus();
  }, [mock, idx, evaluation]);

  if (!sessions.length) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Mock interview" />
        <EmptyState
          icon={Mic}
          title="Generate questions first"
          description="Mock interviews use your personalized question sets. Create one, then come back to practice."
          action={
            <Link to="/app/generate">
              <Button icon={Wand2}>Generate questions</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const start = () => {
    if (!session) return;
    const pool = shuffled ? shuffle(session.questions) : session.questions;
    const run = {
      id: uid('m'),
      createdAt: new Date().toISOString(),
      sessionId: session.id,
      jobTitle: session.jobTitle,
      questions: pool.slice(0, Math.min(length, pool.length)),
      results: [],
      completed: false,
    };
    setMock(run);
    setIdx(0);
    setAnswer('');
    setEvaluation(null);
    setSeconds(0);
    setError('');
    setHint(false);
  };

  const submit = async () => {
    if (answer.trim().split(/\s+/).length < 3) return setError('Type a fuller answer before submitting (or skip this question).');
    setError('');
    setLoading(true);
    try {
      const res = await api.evaluate(state.settings.mode, { question: current, answer, analysis: state.analysis, jobTitle: mock.jobTitle });
      setEvaluation(res.evaluation);
      const result = {
        questionId: current.id,
        question: current.question,
        category: current.category,
        difficulty: current.difficulty,
        answer,
        seconds,
        evaluation: res.evaluation,
      };
      const updated = { ...mock, results: [...mock.results, result] };
      setMock(updated);
      dispatch({ type: 'MARK_PRACTICED', sessionId: mock.sessionId, questionId: current.id });
      if (res.fellBack) toast('AI unavailable: used demo scoring');
    } catch (e) {
      setError(e.message || 'Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finish = async (run) => {
    if (!run.results.length) {
      toast('Answer at least one question to get a report', 'error');
      setMock(null);
      return;
    }
    setFinishing(true);
    const avgScore = run.results.reduce((s, r) => s + r.evaluation.score, 0) / run.results.length;
    let report = null;
    try {
      report = (
        await api.report(state.settings.mode, {
          jobTitle: run.jobTitle,
          results: run.results.map((r) => ({ question: r.question, category: r.category, score: r.evaluation.score, summary: r.evaluation.summary, evaluation: r.evaluation })),
        })
      ).report;
    } catch (e) {
      console.warn(e);
    }
    const final = { ...run, avgScore, report, completed: true, completedAt: new Date().toISOString() };
    dispatch({ type: 'SAVE_MOCK', mock: final });
    setFinishing(false);
    navigate(`/app/mock/${final.id}`);
  };

  const next = () => {
    if (idx + 1 >= mock.questions.length) return finish(mock);
    setIdx(idx + 1);
    setAnswer('');
    setEvaluation(null);
    setSeconds(0);
    setHint(false);
    setError('');
  };

  // ------------------------------------------------------------- setup
  if (!mock) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          eyebrow="Practice"
          title="Mock interview"
          description="Answer one question at a time, like a real interview. You get a score, feedback on clarity, relevance, confidence and structure, and an improved answer."
        />
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-5 sm:p-6 lg:col-span-3">
            <div className="space-y-5">
              <div>
                <Label htmlFor="sess">Question set</Label>
                <select
                  id="sess"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="h-11 w-full rounded-xl border-0 bg-white px-3 text-[15px] text-navy-900 ring-1 ring-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.jobTitle || 'Untitled'}
                      {s.company ? ` · ${s.company}` : ''} · {s.questions.length} questions · {new Date(s.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Interview length</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LENGTHS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setLength(n)}
                      aria-pressed={length === n}
                      className={cx(
                        'rounded-xl py-3 text-center ring-1 transition',
                        length === n ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-navy-700 ring-navy-200 hover:ring-navy-300'
                      )}
                    >
                      <div className="font-display text-lg font-bold">{n}</div>
                      <div className={cx('text-xs', length === n ? 'text-navy-300' : 'text-navy-400')}>~{n * 3} min</div>
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-navy-50 p-3 ring-1 ring-navy-100">
                <input type="checkbox" checked={shuffled} onChange={(e) => setShuffled(e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-brand-400" />
                <Shuffle className="h-4 w-4 text-navy-400" />
                <span className="text-sm text-navy-700">Shuffle question order</span>
              </label>
              <Button size="lg" className="w-full" icon={Play} onClick={start} disabled={!session}>
                Start mock interview
              </Button>
            </div>
          </Card>
          <Card className="p-5 sm:p-6 lg:col-span-2">
            <h3 className="font-display font-semibold text-navy-900">How it works</h3>
            <ol className="mt-4 space-y-4">
              {[
                ['Answer in writing', 'Type your answer as you would say it. Aim for 60–120 seconds of speech.'],
                ['Get scored', 'Each answer is scored out of 10 across four dimensions.'],
                ['Learn from it', 'See what worked, what to improve, and a stronger version of your answer.'],
                ['Review the report', 'Finish to get an overall performance report you can download.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</div>
                  <div>
                    <div className="text-sm font-semibold text-navy-800">{t}</div>
                    <div className="text-sm text-navy-500">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- interview
  const cat = categoryMeta(current.category);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const isLast = idx + 1 >= mock.questions.length;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-navy-600">
          <Mic className="h-4 w-4 text-brand-500" />
          Question {idx + 1} of {mock.questions.length}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-mono text-sm text-navy-600 ring-1 ring-navy-100">
            <Timer className="h-3.5 w-3.5" />
            {fmtTime(seconds)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={Flag}
            onClick={() => (mock.results.length ? finish(mock) : window.confirm('Leave the interview? No answers have been scored yet.') && setMock(null))}
            loading={finishing}
          >
            End
          </Button>
        </div>
      </div>
      <ProgressBar value={((idx + (evaluation ? 1 : 0)) / mock.questions.length) * 100} className="mb-6" />

      <Card className="p-5 sm:p-7">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge className={cat.color} icon={cat.icon}>
            {current.category}
          </Badge>
          <Badge>{current.difficulty}</Badge>
        </div>
        <h2 className="font-display text-xl font-bold leading-snug text-navy-900 sm:text-2xl">{current.question}</h2>

        {!evaluation ? (
          <div className="mt-6">
            <Textarea
              ref={textRef}
              rows={9}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer as if you were speaking to the interviewer…"
              aria-label="Your answer"
              disabled={loading}
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-navy-400">
              <span>
                {words} words {words > 0 && `· ~${Math.max(1, Math.round(words / 2.3))}s spoken`}
              </span>
              <span className="hidden sm:inline">Ctrl/⌘ + Enter to submit</span>
            </div>

            {hint && current.keyPoints?.length > 0 && (
              <div className="mt-4 animate-fade-up rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <span className="flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> Points to cover
                  </span>
                  <button onClick={() => setHint(false)} aria-label="Hide hint">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-900">
                  {current.keyPoints.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="mt-4">
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                {!hint && (
                  <Button variant="ghost" icon={Lightbulb} onClick={() => setHint(true)}>
                    Hint
                  </Button>
                )}
                <Button variant="ghost" icon={SkipForward} onClick={next} disabled={loading}>
                  Skip
                </Button>
              </div>
              <Button icon={Send} onClick={submit} loading={loading} size="lg">
                {loading ? 'Evaluating…' : 'Submit answer'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 animate-fade-up space-y-6">
            <details className="rounded-xl bg-navy-50 p-4 ring-1 ring-navy-100">
              <summary className="cursor-pointer text-sm font-semibold text-navy-700">Your answer</summary>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-600">{answer}</p>
            </details>
            <EvaluationView ev={evaluation} />
            <div className="flex justify-end border-t border-navy-100 pt-5">
              <Button size="lg" icon={isLast ? Flag : ArrowRight} onClick={next} loading={finishing}>
                {isLast ? 'Finish & see report' : 'Next question'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
