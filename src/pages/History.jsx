import { useState } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Target, Mic, Trash2, ChevronRight, Wand2, Sparkles, FlaskConical } from 'lucide-react';
import { Button, Card, PageHeader, EmptyState, Badge, cx } from '../components/ui';
import { useApp } from '../context/AppContext';

const TABS = [
  ['all', 'All'],
  ['session', 'Question sets'],
  ['mock', 'Mock interviews'],
];

export default function History() {
  const { state, dispatch, toast } = useApp();
  const [tab, setTab] = useState('all');

  const rows = [
    ...state.sessions.map((s) => ({
      type: 'session',
      id: s.id,
      at: s.createdAt,
      title: s.jobTitle || 'Interview questions',
      sub: [s.company, `${s.questions.length} questions`, s.difficulty, `${s.questions.filter((q) => q.practiced).length} practiced`].filter(Boolean).join(' · '),
      source: s.source,
      to: `/app/sessions/${s.id}`,
    })),
    ...state.mocks
      .filter((m) => m.completed)
      .map((m) => ({
        type: 'mock',
        id: m.id,
        at: m.createdAt,
        title: `Mock interview · ${m.jobTitle || 'General'}`,
        sub: `${m.results.length} of ${m.questions.length} answered`,
        score: m.avgScore,
        to: `/app/mock/${m.id}`,
      })),
  ]
    .filter((r) => tab === 'all' || r.type === tab)
    .sort((a, b) => new Date(b.at) - new Date(a.at));

  const remove = (r) => {
    if (!window.confirm(`Delete this ${r.type === 'mock' ? 'mock interview' : 'question set'}?`)) return;
    dispatch({ type: r.type === 'mock' ? 'DELETE_MOCK' : 'DELETE_SESSION', id: r.id });
    toast('Deleted');
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Interview history" description="Every question set you generated and every mock interview you completed." />
      <div className="mb-4 inline-flex rounded-xl bg-white p-1 ring-1 ring-navy-100">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cx('rounded-lg px-3.5 py-1.5 text-sm font-medium transition', tab === id ? 'bg-navy-900 text-white' : 'text-navy-500 hover:text-navy-800')}
          >
            {label}
          </button>
        ))}
      </div>
      {!rows.length ? (
        <EmptyState
          icon={HistoryIcon}
          title="Nothing here yet"
          description="Generate a question set or complete a mock interview and it will show up here."
          action={
            <Link to="/app/generate">
              <Button icon={Wand2}>Generate questions</Button>
            </Link>
          }
        />
      ) : (
        <Card className="divide-y divide-navy-100">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 sm:gap-4">
              <Link to={r.to} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', r.type === 'mock' ? 'bg-sky-50 text-sky-600' : 'bg-brand-50 text-brand-600')}>
                  {r.type === 'mock' ? <Mic className="h-[18px] w-[18px]" /> : <Target className="h-[18px] w-[18px]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-navy-900">{r.title}</span>
                    {r.type === 'session' && (
                      <Badge className={r.source === 'ai' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'} icon={r.source === 'ai' ? Sparkles : FlaskConical}>
                        {r.source === 'ai' ? 'AI' : 'Demo'}
                      </Badge>
                    )}
                    {r.score != null && <Badge className="bg-sky-50 text-sky-700 ring-sky-200">{r.score.toFixed(1)}/10</Badge>}
                  </div>
                  <div className="truncate text-sm text-navy-500">{r.sub}</div>
                </div>
                <div className="hidden text-right text-xs text-navy-400 sm:block">
                  {new Date(r.at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  <br />
                  {new Date(r.at).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-navy-300" />
              </Link>
              <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
