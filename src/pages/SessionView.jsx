import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, Mic, Trash2, ArrowLeft, Target, CheckCircle2, XCircle, Lightbulb, SearchX, Sparkles, FlaskConical, Wand2 } from 'lucide-react';
import { Button, Card, PageHeader, Badge, EmptyState, ProgressBar } from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import QuestionFilters, { useFiltered, emptyFilters } from '../components/QuestionFilters';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { downloadQuestionsReport } from '../lib/pdfReport';

export function MatchPanel({ match }) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col justify-center bg-brand-soft p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-700">
            <Target className="h-4 w-4 text-brand-600" /> Job match
          </div>
          <div className="mt-1 font-display text-4xl font-extrabold text-navy-900">{match.matchScore}%</div>
          <ProgressBar value={match.matchScore} className="mt-3" />
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Matched
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.matchedSkills.length ? match.matchedSkills.slice(0, 10).map((s) => <Badge key={s} className="bg-emerald-50 text-emerald-700 ring-emerald-200">{s}</Badge>) : <span className="text-sm text-navy-400">None detected</span>}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700">
              <XCircle className="h-3.5 w-3.5" /> Missing
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.length ? match.missingSkills.slice(0, 10).map((s) => <Badge key={s} className="bg-rose-50 text-rose-700 ring-rose-200">{s}</Badge>) : <span className="text-sm text-navy-400">No gaps found</span>}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <Lightbulb className="h-3.5 w-3.5" /> Prepare
            </div>
            <ul className="space-y-1.5 text-sm text-navy-600">
              {match.recommendations.slice(0, 3).map((r, i) => (
                <li key={i} className="leading-snug">{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SessionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, toast } = useApp();
  const [filters, setFilters] = useState(emptyFilters);
  const [regenId, setRegenId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const session = state.sessions.find((s) => s.id === id);
  const filtered = useFiltered(session?.questions || [], filters);

  if (!session) {
    return (
      <EmptyState
        icon={SearchX}
        title="Session not found"
        description="It may have been deleted."
        action={
          <Link to="/app/history">
            <Button variant="secondary">View history</Button>
          </Link>
        }
      />
    );
  }

  const practiced = session.questions.filter((q) => q.practiced).length;

  const regenerate = async (q) => {
    if (!state.resume) return toast('Upload a resume to regenerate questions', 'error');
    setRegenId(q.id);
    try {
      const res = await api.regenerate(state.settings.mode, {
        resumeText: state.resume.text,
        analysis: state.analysis,
        jobTitle: session.jobTitle,
        company: session.company,
        jobDescription: state.job.description,
        question: q,
        existing: session.questions,
      });
      dispatch({ type: 'REPLACE_QUESTION', sessionId: session.id, questionId: q.id, question: res.question });
      toast('Question regenerated');
    } catch (e) {
      toast(e.message || 'Could not regenerate', 'error');
    } finally {
      setRegenId(null);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadQuestionsReport({ session, analysis: state.analysis });
      toast('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast('Could not create the PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const remove = () => {
    if (!window.confirm('Delete this question set? Bookmarks inside it will be removed too.')) return;
    dispatch({ type: 'DELETE_SESSION', id: session.id });
    toast('Session deleted');
    navigate('/app/history');
  };

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader
        eyebrow={new Date(session.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        title={session.jobTitle || 'Interview questions'}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {session.company && <span>{session.company} ·</span>}
            <span>{session.questions.length} questions · {session.difficulty}</span>
            <Badge className={session.source === 'ai' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'} icon={session.source === 'ai' ? Sparkles : FlaskConical}>
              {session.source === 'ai' ? 'AI generated' : 'Demo'}
            </Badge>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={download} loading={downloading}>
              PDF
            </Button>
            <Button variant="secondary" icon={Trash2} onClick={remove} aria-label="Delete session">
              <span className="sr-only sm:not-sr-only">Delete</span>
            </Button>
            <Button icon={Mic} onClick={() => navigate(`/app/mock?session=${session.id}`)}>
              Mock interview
            </Button>
          </>
        }
      />

      <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-navy-700">Practice progress</span>
            <span className="text-navy-500">
              {practiced} / {session.questions.length} practiced
            </span>
          </div>
          <ProgressBar value={(practiced / session.questions.length) * 100} />
        </div>
        <Link to="/app/generate">
          <Button variant="soft" icon={Wand2} size="sm">
            New set
          </Button>
        </Link>
      </Card>

      {session.match && <MatchPanel match={session.match} />}

      <QuestionFilters filters={filters} setFilters={setFilters} questions={session.questions} total={filtered.length} />

      {filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No questions match your filters" action={<Button variant="secondary" onClick={() => setFilters(emptyFilters)}>Clear filters</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={session.questions.indexOf(q)}
              sessionId={session.id}
              onRegenerate={regenerate}
              regenerating={regenId === q.id}
              defaultOpen={session.questions.indexOf(q) === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
