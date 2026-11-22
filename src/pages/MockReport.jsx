import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, RotateCcw, Trophy, Target, ListTodo, SearchX, ChevronDown, Clock } from 'lucide-react';
import { Button, Card, PageHeader, Badge, EmptyState, ScoreRing, cx } from '../components/ui';
import { EvaluationView } from './MockInterview';
import { useApp } from '../context/AppContext';
import { categoryMeta } from '../lib/constants';
import { downloadMockReport } from '../lib/pdfReport';

function ResultRow({ r, i }) {
  const [open, setOpen] = useState(false);
  const cat = categoryMeta(r.category);
  const s = r.evaluation.score;
  return (
    <Card className={cx('transition', open && 'ring-brand-200 shadow-lift')}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5" aria-expanded={open}>
        <div
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold',
            s >= 8 ? 'bg-emerald-50 text-emerald-700' : s >= 6 ? 'bg-brand-50 text-brand-700' : s >= 4 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
          )}
        >
          {s}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge className={cat.color} icon={cat.icon}>{r.category}</Badge>
            {r.seconds > 0 && (
              <span className="flex items-center gap-1 text-xs text-navy-400">
                <Clock className="h-3 w-3" /> {Math.floor(r.seconds / 60)}m {r.seconds % 60}s
              </span>
            )}
          </div>
          <div className="text-[15px] font-semibold leading-snug text-navy-900">
            {i + 1}. {r.question}
          </div>
        </div>
        <ChevronDown className={cx('h-5 w-5 shrink-0 text-navy-300 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="animate-fade-up space-y-5 border-t border-navy-100 p-4 sm:p-6">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-navy-500">Your answer</div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-navy-600">{r.answer}</p>
          </div>
          <EvaluationView ev={r.evaluation} />
        </div>
      )}
    </Card>
  );
}

export default function MockReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, toast } = useApp();
  const [downloading, setDownloading] = useState(false);
  const mock = state.mocks.find((m) => m.id === id);

  if (!mock) {
    return <EmptyState icon={SearchX} title="Report not found" action={<Link to="/app/history"><Button variant="secondary">View history</Button></Link>} />;
  }

  const dims = ['clarity', 'relevance', 'confidence', 'structure'].map((d) => ({
    d,
    v: mock.results.reduce((s, r) => s + r.evaluation[d], 0) / mock.results.length,
  }));
  const r = mock.report;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadMockReport({ mock });
      toast('Report downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not create the PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate('/app/history')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Interview history
      </button>
      <PageHeader
        eyebrow={`Mock interview · ${new Date(mock.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`}
        title="Performance report"
        description={`${mock.jobTitle || 'General'} · ${mock.results.length} answered of ${mock.questions.length}`}
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={download} loading={downloading}>
              Download PDF
            </Button>
            <Button icon={RotateCcw} onClick={() => navigate(`/app/mock?session=${mock.sessionId}`)}>
              Practice again
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing value={Math.round(mock.avgScore * 10) / 10} size={140} stroke={11} label="Overall" />
          <div className="mt-4 font-display text-lg font-semibold text-navy-900">
            {mock.avgScore >= 8 ? 'Interview ready' : mock.avgScore >= 6 ? 'Good progress' : mock.avgScore >= 4 ? 'Keep practicing' : 'Needs more practice'}
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            {dims.map(({ d, v }) => (
              <div key={d} className="rounded-xl bg-navy-50 px-3 py-2 ring-1 ring-navy-100">
                <div className="text-[11px] font-medium uppercase tracking-wide text-navy-400">{d}</div>
                <div className="font-display text-lg font-bold text-navy-900">{v.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 lg:col-span-2">
          {r ? (
            <div className="space-y-5">
              <p className="text-[15px] leading-relaxed text-navy-700">{r.overallSummary}</p>
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  ['Strengths', Trophy, 'text-emerald-600', r.strengths],
                  ['Focus areas', Target, 'text-amber-600', r.focusAreas],
                  ['Next steps', ListTodo, 'text-brand-600', r.nextSteps],
                ].map(([t, Icon, tone, items]) => (
                  <div key={t}>
                    <div className={cx('mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide', tone)}>
                      <Icon className="h-3.5 w-3.5" /> {t}
                    </div>
                    <ul className="space-y-2 text-sm leading-snug text-navy-700">
                      {items.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-navy-500">The summary report could not be generated, but your per-question feedback is below.</p>
          )}
        </Card>
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-navy-900">Question breakdown</h2>
      <div className="space-y-3">
        {mock.results.map((res, i) => (
          <ResultRow key={i} r={res} i={i} />
        ))}
      </div>
    </div>
  );
}
