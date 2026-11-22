import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Download, SearchX, Wand2 } from 'lucide-react';
import { Button, PageHeader, EmptyState } from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import QuestionFilters, { useFiltered, emptyFilters } from '../components/QuestionFilters';
import { useApp } from '../context/AppContext';
import { downloadQuestionsReport } from '../lib/pdfReport';

export default function Saved() {
  const { state, toast } = useApp();
  const [filters, setFilters] = useState(emptyFilters);
  const items = state.sessions.flatMap((s) => s.questions.filter((q) => q.bookmarked).map((q) => ({ ...q, _session: s })));
  const filtered = useFiltered(items, filters);

  const download = async () => {
    try {
      await downloadQuestionsReport({
        session: { createdAt: new Date().toISOString(), jobTitle: 'Saved questions', company: '', difficulty: 'Mixed', questions: items },
        analysis: state.analysis,
      });
      toast('PDF downloaded');
    } catch {
      toast('Could not create the PDF', 'error');
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Saved questions"
        description="Questions you bookmarked across all your question sets."
        actions={items.length > 0 && <Button variant="secondary" icon={Download} onClick={download}>Download PDF</Button>}
      />
      {!items.length ? (
        <EmptyState
          icon={Bookmark}
          title="No saved questions yet"
          description="Tap the bookmark icon on any question to save it here for quick review before your interview."
          action={
            <Link to={state.sessions[0] ? `/app/sessions/${state.sessions[0].id}` : '/app/generate'}>
              <Button icon={Wand2}>{state.sessions[0] ? 'Browse your questions' : 'Generate questions'}</Button>
            </Link>
          }
        />
      ) : (
        <>
          <QuestionFilters filters={filters} setFilters={setFilters} questions={items} total={filtered.length} />
          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title="No saved questions match your filters" action={<Button variant="secondary" onClick={() => setFilters(emptyFilters)}>Clear filters</Button>} />
          ) : (
            <div className="space-y-3">
              {filtered.map((q) => (
                <QuestionCard key={q.id} q={q} sessionId={q._session.id} context={q._session.jobTitle} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
