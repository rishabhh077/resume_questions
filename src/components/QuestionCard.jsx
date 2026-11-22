import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Copy,
  RefreshCw,
  CheckCircle2,
  Circle,
  Lightbulb,
  ListChecks,
  OctagonX,
  CornerDownRight,
  FileText,
  PencilLine,
} from 'lucide-react';
import { Badge, RichAnswer, cx } from './ui';
import { categoryMeta, difficultyMeta } from '../lib/constants';
import { useApp } from '../context/AppContext';

function Section({ icon: Icon, title, tone = 'text-navy-400', children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
        <Icon className={cx('h-3.5 w-3.5', tone)} />
        {title}
      </div>
      {children}
    </div>
  );
}

function List({ items, marker = 'dot' }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-navy-700">
          {marker === 'dot' ? (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          ) : (
            <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" />
          )}
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function QuestionCard({ q, index, sessionId, onRegenerate, regenerating, defaultOpen = false, context }) {
  const [open, setOpen] = useState(defaultOpen);
  const { dispatch, toast } = useApp();
  const cat = categoryMeta(q.category);
  const diff = difficultyMeta(q.difficulty);
  const CatIcon = cat.icon;

  const copy = async (e) => {
    e.stopPropagation();
    const text = `Q: ${q.question}\n\nSample answer:\n${q.sampleAnswer}\n\nKey points:\n${q.keyPoints.map((k) => `- ${k}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('Answer copied to clipboard');
    } catch {
      toast('Could not access the clipboard', 'error');
    }
  };

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <article
      className={cx(
        'group rounded-2xl bg-white ring-1 transition-all duration-200',
        open ? 'shadow-lift ring-brand-200' : 'shadow-card ring-navy-100 hover:ring-navy-200',
        regenerating && 'opacity-60'
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen((o) => !o))}
        className="flex cursor-pointer gap-4 p-4 sm:p-5"
      >
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 font-display text-sm font-bold text-navy-400 ring-1 ring-navy-100 sm:flex">
          {index != null ? index + 1 : <CatIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge className={cat.color} icon={CatIcon}>
              {q.category}
            </Badge>
            <Badge>
              <span className={cx('h-1.5 w-1.5 rounded-full', diff.dot)} />
              {q.difficulty}
            </Badge>
            {q.needsPersonalDetails && (
              <Badge className="bg-amber-50 text-amber-700 ring-amber-200" icon={PencilLine}>
                Add your details
              </Badge>
            )}
            {q.practiced && (
              <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200" icon={CheckCircle2}>
                Practiced
              </Badge>
            )}
            {context && <span className="text-xs text-navy-400">· {context}</span>}
          </div>
          <h3 className="text-[15.5px] font-semibold leading-snug text-navy-900 sm:text-base">{q.question}</h3>
          {q.resumeReference && q.resumeReference !== 'General' && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-navy-400">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">Based on: {q.resumeReference}</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-start">
          <button
            onClick={stop(() => dispatch({ type: 'TOGGLE_BOOKMARK', sessionId, questionId: q.id }))}
            className={cx('rounded-lg p-2 transition', q.bookmarked ? 'text-brand-600 hover:bg-brand-50' : 'text-navy-300 hover:bg-navy-50 hover:text-navy-600')}
            aria-label={q.bookmarked ? 'Remove bookmark' : 'Bookmark question'}
            title={q.bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {q.bookmarked ? <BookmarkCheck className="h-[18px] w-[18px]" /> : <Bookmark className="h-[18px] w-[18px]" />}
          </button>
          <ChevronDown className={cx('m-2 h-[18px] w-[18px] text-navy-300 transition-transform', open && 'rotate-180 text-brand-500')} />
        </div>
      </div>

      {open && (
        <div className="animate-fade-up border-t border-navy-100 px-4 pb-5 pt-5 sm:px-5 sm:pl-[76px]">
          <div className="space-y-6">
            {q.whyAsked && (
              <div className="rounded-xl bg-brand-soft p-4 ring-1 ring-brand-100">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  <Lightbulb className="h-3.5 w-3.5" /> Why interviewers ask this
                </div>
                <p className="text-sm leading-relaxed text-navy-700">{q.whyAsked}</p>
              </div>
            )}

            <Section icon={FileText} title="Sample answer" tone="text-brand-500">
              <RichAnswer text={q.sampleAnswer} className="text-[15px] text-navy-800" />
              {q.needsPersonalDetails && (
                <p className="mt-2 text-xs text-amber-700">Highlighted parts need your own real details. We never invent experience you don’t have.</p>
              )}
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              {q.keyPoints?.length > 0 && (
                <Section icon={ListChecks} title="Key points to include" tone="text-emerald-500">
                  <List items={q.keyPoints} />
                </Section>
              )}
              {q.mistakesToAvoid?.length > 0 && (
                <Section icon={OctagonX} title="Mistakes to avoid" tone="text-rose-500">
                  <List items={q.mistakesToAvoid} />
                </Section>
              )}
            </div>

            {q.followUps?.length > 0 && (
              <Section icon={CornerDownRight} title="Likely follow-up questions">
                <List items={q.followUps} marker="arrow" />
              </Section>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-navy-100 pt-4">
            <ActionBtn icon={Copy} onClick={copy}>
              Copy answer
            </ActionBtn>
            {onRegenerate && (
              <ActionBtn icon={RefreshCw} onClick={stop(() => onRegenerate(q))} spinning={regenerating} disabled={regenerating}>
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </ActionBtn>
            )}
            <ActionBtn
              icon={q.practiced ? CheckCircle2 : Circle}
              onClick={stop(() => dispatch({ type: 'TOGGLE_PRACTICED', sessionId, questionId: q.id }))}
              active={q.practiced}
            >
              {q.practiced ? 'Practiced' : 'Mark as practiced'}
            </ActionBtn>
          </div>
        </div>
      )}
    </article>
  );
}

function ActionBtn({ icon: Icon, children, onClick, active, spinning, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium ring-1 transition disabled:opacity-60',
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-navy-600 ring-navy-200 hover:bg-navy-50'
      )}
    >
      <Icon className={cx('h-3.5 w-3.5', spinning && 'animate-spin')} />
      {children}
    </button>
  );
}
