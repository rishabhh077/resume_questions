import { Link } from 'react-router-dom';
import {
  Wand2,
  FileUp,
  Mic,
  Bookmark,
  ListChecks,
  TrendingUp,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  FileText,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar, cx } from '../components/ui';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../lib/constants';
import { useLoadDemo } from '../lib/demoLoader';

function StatTile({ icon: Icon, label, value, sub, tone = 'text-brand-600 bg-brand-50' }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-navy-500">{label}</div>
        <div className={cx('flex h-9 w-9 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-navy-400">{sub}</div>}
    </Card>
  );
}

function CardTitle({ icon: Icon, children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-display font-semibold text-navy-900">
        <Icon className="h-4 w-4 text-brand-500" />
        {children}
      </h2>
      {action}
    </div>
  );
}

function Onboarding() {
  const loadDemo = useLoadDemo();
  const steps = [
    ['Upload your resume', 'PDF, DOCX or pasted text', FileUp, '/app/upload'],
    ['Generate questions', 'Pick role, categories and difficulty', Wand2, '/app/generate'],
    ['Practice with AI', 'Mock interview with scoring', Mic, '/app/mock'],
  ];
  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="relative">
        <Badge className="bg-brand-50 text-brand-700 ring-brand-200" icon={Sparkles}>
          Get started
        </Badge>
        <h2 className="mt-3 font-display text-2xl font-bold text-navy-900">Let’s get you interview-ready</h2>
        <p className="mt-1.5 max-w-xl text-navy-500">Three steps from resume to confident answers. Or explore everything instantly with sample data.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map(([t, d, Icon, to], i) => (
            <Link key={t} to={to} className="group rounded-xl bg-white p-4 ring-1 ring-navy-100 transition hover:shadow-card hover:ring-brand-200">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-600 ring-1 ring-brand-100">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-display text-sm font-bold text-navy-200">0{i + 1}</span>
              </div>
              <div className="font-semibold text-navy-900">{t}</div>
              <div className="text-sm text-navy-500">{d}</div>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/app/upload">
            <Button icon={FileUp}>Upload resume</Button>
          </Link>
          <Button variant="secondary" onClick={() => loadDemo()} icon={Sparkles}>
            Try with sample data
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { state } = useApp();
  const { analysis, sessions, mocks, match } = state;
  const allQ = sessions.flatMap((s) => s.questions);
  const practiced = allQ.filter((q) => q.practiced).length;
  const saved = allQ.filter((q) => q.bookmarked).length;
  const doneMocks = mocks.filter((m) => m.completed);
  const avgMock = doneMocks.length ? doneMocks.reduce((s, m) => s + m.avgScore, 0) / doneMocks.length : null;
  const progress = allQ.length ? Math.round((practiced / allQ.length) * 100) : 0;
  const firstName = analysis?.name?.split(' ')[0];

  const perCat = CATEGORIES.map((c) => {
    const qs = allQ.filter((q) => q.category === c.name);
    return { ...c, total: qs.length, done: qs.filter((q) => q.practiced).length };
  }).filter((c) => c.total > 0);

  // Weakest mock dimension → improvement area
  const dimNames = { clarity: 'Clarity', relevance: 'Relevance', confidence: 'Confidence', structure: 'Answer structure' };
  let weakDim = null;
  if (doneMocks.length) {
    const rs = doneMocks.flatMap((m) => m.results);
    const avgs = Object.keys(dimNames).map((d) => [d, rs.reduce((s, r) => s + r.evaluation[d], 0) / rs.length]);
    weakDim = avgs.sort((a, b) => a[1] - b[1])[0];
  }
  const improvements = [
    ...(weakDim ? [`Mock interviews: ${dimNames[weakDim[0]]} is your lowest score (${weakDim[1].toFixed(1)}/10).`] : []),
    ...(analysis?.improvementAreas || []),
  ].slice(0, 5);

  const recent = [
    ...sessions.map((s) => ({ type: 'session', id: s.id, at: s.createdAt, title: s.jobTitle || 'Interview questions', meta: `${s.questions.length} questions · ${s.difficulty}`, to: `/app/sessions/${s.id}` })),
    ...doneMocks.map((m) => ({ type: 'mock', id: m.id, at: m.createdAt, title: `Mock interview · ${m.jobTitle || 'General'}`, meta: `Score ${m.avgScore.toFixed(1)}/10 · ${m.results.length} answers`, to: `/app/mock/${m.id}` })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">Dashboard</div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-[28px]">{firstName ? `Welcome back, ${firstName}` : 'Welcome to InterviewPrep AI'}</h1>
          <p className="mt-1 text-navy-500">{analysis ? 'Here’s where your interview preparation stands.' : 'Turn your resume into your interview superpower.'}</p>
        </div>
        {analysis && (
          <div className="flex gap-2">
            <Link to="/app/mock">
              <Button variant="secondary" icon={Mic}>
                Practice
              </Button>
            </Link>
            <Link to="/app/generate">
              <Button icon={Wand2}>Generate questions</Button>
            </Link>
          </div>
        )}
      </div>

      {!analysis && <Onboarding />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={ListChecks} label="Questions generated" value={allQ.length} sub={`${sessions.length} question set${sessions.length === 1 ? '' : 's'}`} />
        <StatTile icon={CheckCircle2} label="Practiced" value={`${progress}%`} sub={`${practiced} of ${allQ.length} questions`} tone="text-emerald-600 bg-emerald-50" />
        <StatTile icon={Mic} label="Mock interviews" value={doneMocks.length} sub={avgMock != null ? `Average ${avgMock.toFixed(1)}/10` : 'None yet'} tone="text-sky-600 bg-sky-50" />
        <StatTile icon={Bookmark} label="Saved questions" value={saved} sub="Bookmarked for review" tone="text-amber-600 bg-amber-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <CardTitle icon={TrendingUp}>Interview preparation progress</CardTitle>
          <div className="mb-5 flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar value={progress} className="h-3" />
            </div>
            <div className="font-display text-xl font-bold text-navy-900">{progress}%</div>
          </div>
          {perCat.length ? (
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {perCat.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1', c.color)}>
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate font-medium text-navy-700">{c.name}</span>
                      <span className="text-navy-400">
                        {c.done}/{c.total}
                      </span>
                    </div>
                    <ProgressBar value={(c.done / c.total) * 100} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-500">Generate questions to start tracking progress by category. Mark questions as practiced or answer them in a mock interview.</p>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <CardTitle
            icon={FileText}
            action={
              analysis && (
                <Link to="/app/upload" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  View
                </Link>
              )
            }
          >
            Resume summary
          </CardTitle>
          {analysis ? (
            <div>
              <div className="font-semibold text-navy-900">{analysis.name || state.resume?.fileName}</div>
              <div className="text-sm text-navy-500">{analysis.headline}</div>
              <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-navy-600">{analysis.summary}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Years', analysis.yearsOfExperience || '—'],
                  ['Roles', analysis.experience?.length || 0],
                  ['Projects', analysis.projects?.length || 0],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-navy-50 py-2 ring-1 ring-navy-100">
                    <div className="font-display text-lg font-bold text-navy-900">{v}</div>
                    <div className="text-[11px] text-navy-400">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-navy-500">
              No resume yet.{' '}
              <Link to="/app/upload" className="font-medium text-brand-600">
                Upload one
              </Link>{' '}
              to see your analysis.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <CardTitle icon={Sparkles}>Strong skills identified</CardTitle>
          {analysis?.strongSkills?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.strongSkills.map((s) => (
                <Badge key={s} className="bg-brand-50 text-brand-700 ring-brand-200">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-500">Appears after resume analysis.</p>
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <CardTitle icon={XCircle} action={match && <span className="font-display text-sm font-bold text-brand-600">{match.matchScore}% match</span>}>
            Missing from job description
          </CardTitle>
          {match ? (
            match.missingSkills.length ? (
              <div className="flex flex-wrap gap-1.5">
                {match.missingSkills.map((s) => (
                  <Badge key={s} className="bg-rose-50 text-rose-700 ring-rose-200">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-700">Your resume covers every requirement we detected.</p>
            )
          ) : (
            <p className="text-sm text-navy-500">
              Paste a job description on the{' '}
              <Link to="/app/generate" className="font-medium text-brand-600">
                Generate
              </Link>{' '}
              page to see skill gaps.
            </p>
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <CardTitle icon={AlertTriangle}>Areas to improve</CardTitle>
          {improvements.length ? (
            <ul className="space-y-2">
              {improvements.map((x, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug text-navy-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {x}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-navy-500">Appears after resume analysis and mock interviews.</p>
          )}
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <CardTitle
          icon={Clock}
          action={
            recent.length > 0 && (
              <Link to="/app/history" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )
          }
        >
          Recent interview sessions
        </CardTitle>
        {recent.length ? (
          <ul className="-mx-2 divide-y divide-navy-100">
            {recent.map((r) => (
              <li key={r.id}>
                <Link to={r.to} className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-navy-50">
                  <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', r.type === 'mock' ? 'bg-sky-50 text-sky-600' : 'bg-brand-50 text-brand-600')}>
                    {r.type === 'mock' ? <Mic className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-navy-900">{r.title}</div>
                    <div className="text-xs text-navy-500">{r.meta}</div>
                  </div>
                  <div className="hidden text-xs text-navy-400 sm:block">{new Date(r.at).toLocaleDateString()}</div>
                  <ChevronRight className="h-4 w-4 text-navy-300" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-navy-500">Your generated question sets and mock interviews will appear here.</p>
        )}
      </Card>
    </div>
  );
}

