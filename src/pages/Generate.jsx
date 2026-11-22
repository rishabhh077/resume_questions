import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wand2, FileUp, Target, Building2, CheckCircle2, Loader2, Gauge, ListOrdered, LayoutGrid } from 'lucide-react';
import { Button, Card, PageHeader, Input, Textarea, Label, Chip, EmptyState, Alert, Badge, ProgressBar, cx } from '../components/ui';
import { useApp, uid } from '../context/AppContext';
import { CATEGORIES, DIFFICULTIES, COUNTS } from '../lib/constants';
import { api } from '../lib/api';

const STEPS = ['Reading your resume profile', 'Matching against the job', 'Drafting resume-specific questions', 'Writing personalized answers', 'Adding follow-ups and tips'];

function GeneratingOverlay({ count, ai }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const per = ai ? Math.max(2500, count * 500) : 300;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), per);
    return () => clearInterval(t);
  }, [count, ai]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/30 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-fade-up p-7 shadow-lift">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display font-semibold text-navy-900">Generating {count} questions</div>
            <div className="text-xs text-navy-500">{ai ? (count > 10 ? 'This can take up to a minute' : 'Usually 15–30 seconds') : 'Demo mode'}</div>
          </div>
        </div>
        <ProgressBar value={((step + 1) / STEPS.length) * 92} className="mb-5" />
        <ul className="space-y-2.5">
          {STEPS.map((s, i) => (
            <li key={s} className={cx('flex items-center gap-2.5 text-sm transition', i <= step ? 'text-navy-800' : 'text-navy-300')}>
              {i < step ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-brand-500" /> : <span className="h-4 w-4 rounded-full border-2 border-navy-200" />}
              {s}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function Generate() {
  const { state, dispatch, toast, aiActive } = useApp();
  const navigate = useNavigate();
  const { settings } = state;
  const [job, setJob] = useState(() => ({
    title: state.job.title || state.analysis?.suggestedRoles?.[0] || '',
    company: state.job.company,
    description: state.job.description,
  }));
  const [categories, setCategories] = useState(settings.defaultCategories);
  const [difficulty, setDifficulty] = useState(settings.defaultDifficulty);
  const [count, setCount] = useState(settings.defaultCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'SET_JOB', job }), 400);
    return () => clearTimeout(t);
  }, [job, dispatch]);

  if (!state.analysis) {
    return (
      <div className="animate-fade-up">
        <PageHeader eyebrow="Step 2" title="Generate interview questions" />
        <EmptyState
          icon={FileUp}
          title="Upload your resume first"
          description="Questions are built from the details in your resume, so we need to analyze it before generating."
          action={
            <Link to="/app/upload">
              <Button icon={FileUp}>Upload resume</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const toggleCat = (name) => setCategories((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]));
  const allSelected = categories.length === CATEGORIES.length;

  const generate = async () => {
    setError('');
    if (!job.title.trim()) return setError('Please enter the job title you are preparing for.');
    if (!categories.length) return setError('Select at least one question category.');
    setLoading(true);
    const mode = settings.mode;
    const base = { resumeText: state.resume.text, analysis: state.analysis, jobTitle: job.title.trim(), company: job.company.trim(), jobDescription: job.description.trim() };
    try {
      let match = null;
      if (base.jobDescription.length >= 30) {
        try {
          match = (await api.match(mode, base)).match;
          dispatch({ type: 'SET_MATCH', match });
        } catch (e) {
          console.warn('Match failed', e);
        }
      } else dispatch({ type: 'SET_MATCH', match: null });

      const res = await api.generate(mode, { ...base, categories, difficulty, count, missingSkills: match?.missingSkills || [] });
      const session = {
        id: uid('s'),
        createdAt: new Date().toISOString(),
        jobTitle: base.jobTitle,
        company: base.company,
        difficulty,
        categories,
        questions: res.questions,
        match,
        source: res.source,
      };
      dispatch({ type: 'ADD_SESSION', session });
      toast(res.fellBack ? 'AI unavailable: generated demo questions' : `${res.questions.length} questions generated`);
      navigate(`/app/sessions/${session.id}`);
    } catch (e) {
      setError(e.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {loading && <GeneratingOverlay count={count} ai={aiActive} />}
      <PageHeader
        eyebrow="Step 2"
        title="Generate interview questions"
        description={`Tailored to ${state.analysis.name || 'your resume'}${state.analysis.yearsOfExperience ? ` · ${state.analysis.yearsOfExperience} years of experience` : ''}.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-500" />
              <h2 className="font-display font-semibold text-navy-900">Target job</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Job title *</Label>
                <Input id="title" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" maxLength={120} />
              </div>
              <div>
                <Label htmlFor="company" hint="Optional">
                  Company
                </Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                  <Input id="company" value={job.company} onChange={(e) => setJob({ ...job, company: e.target.value })} placeholder="e.g. Acme Corp" className="pl-9" maxLength={120} />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="jd" hint="Optional, but improves relevance">
                Job description
              </Label>
              <Textarea
                id="jd"
                rows={6}
                value={job.description}
                onChange={(e) => setJob({ ...job, description: e.target.value })}
                placeholder="Paste the job description to match your skills against its requirements…"
                maxLength={20000}
              />
            </div>
            {state.analysis.suggestedRoles?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-navy-400">
                Suggested roles:
                {state.analysis.suggestedRoles.slice(0, 4).map((r) => (
                  <button key={r} onClick={() => setJob({ ...job, title: r })} className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-600 ring-1 ring-navy-100 hover:bg-brand-50 hover:text-brand-700">
                    {r}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-brand-500" />
                <h2 className="font-display font-semibold text-navy-900">Question categories</h2>
                <Badge>{categories.length} selected</Badge>
              </div>
              <button onClick={() => setCategories(allSelected ? [] : CATEGORIES.map((c) => c.name))} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c.name} active={categories.includes(c.name)} onClick={() => toggleCat(c.name)} icon={c.icon}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-5">
            <Card className="p-5 sm:p-6 md:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-brand-500" />
                <h2 className="font-display font-semibold text-navy-900">Difficulty</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.name}
                    onClick={() => setDifficulty(d.name)}
                    aria-pressed={difficulty === d.name}
                    className={cx(
                      'rounded-xl p-3 text-left ring-1 transition',
                      difficulty === d.name ? 'bg-brand-50 ring-2 ring-brand-400' : 'bg-white ring-navy-200 hover:ring-navy-300'
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                      <span className={cx('h-2 w-2 rounded-full', d.dot)} />
                      {d.name}
                    </div>
                    <div className="mt-0.5 text-xs leading-snug text-navy-500">{d.desc}</div>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-5 sm:p-6 md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-brand-500" />
                <h2 className="font-display font-semibold text-navy-900">Number of questions</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    aria-pressed={count === n}
                    className={cx(
                      'h-14 rounded-xl font-display text-lg font-bold ring-1 transition',
                      count === n ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-navy-700 ring-navy-200 hover:ring-navy-300'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-8">
            <Card className="p-5 sm:p-6">
              <h2 className="font-display font-semibold text-navy-900">Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ['Candidate', state.analysis.name || 'Your resume'],
                  ['Role', job.title || '—'],
                  ['Company', job.company || '—'],
                  ['Job description', job.description.trim() ? 'Provided' : 'Not provided'],
                  ['Categories', categories.length],
                  ['Difficulty', difficulty],
                  ['Questions', count],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-navy-500">{k}</dt>
                    <dd className="truncate text-right font-medium text-navy-900">{v}</dd>
                  </div>
                ))}
              </dl>
              {error && (
                <div className="mt-4">
                  <Alert tone="error">{error}</Alert>
                </div>
              )}
              <Button size="lg" className="mt-5 w-full" onClick={generate} loading={loading} icon={Wand2}>
                Generate Interview Questions
              </Button>
              <p className="mt-3 text-center text-xs text-navy-400">{aiActive ? 'Powered by Claude' : 'Demo mode: template-based questions. Add an API key for full AI.'}</p>
            </Card>
            {state.match && (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-navy-800">Last job match</div>
                  <div className="font-display text-lg font-bold text-brand-600">{state.match.matchScore}%</div>
                </div>
                <ProgressBar value={state.match.matchScore} className="mt-2" />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
