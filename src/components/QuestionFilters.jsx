import { Search, X } from 'lucide-react';
import { CATEGORY_NAMES, DIFFICULTIES } from '../lib/constants';
import { cx } from './ui';

export function useFiltered(questions, filters) {
  const s = filters.search.trim().toLowerCase();
  return questions.filter(
    (q) =>
      (filters.category === 'All' || q.category === filters.category) &&
      (filters.difficulty === 'All' || q.difficulty === filters.difficulty) &&
      (!s || q.question.toLowerCase().includes(s) || q.sampleAnswer.toLowerCase().includes(s) || (q.resumeReference || '').toLowerCase().includes(s))
  );
}

export const emptyFilters = { category: 'All', difficulty: 'All', search: '' };

const selectCls =
  'h-10 rounded-xl border-0 bg-white pl-3 pr-8 text-sm font-medium text-navy-700 ring-1 ring-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-400';

export default function QuestionFilters({ filters, setFilters, questions, total }) {
  const present = new Set(questions.map((q) => q.category));
  const active = filters.category !== 'All' || filters.difficulty !== 'All' || filters.search;
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search questions and answers…"
          className="h-10 w-full rounded-xl border-0 bg-white pl-9 pr-3 text-sm text-navy-900 ring-1 ring-navy-200 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-label="Search questions"
        />
      </div>
      <div className="flex gap-2">
        <select className={cx(selectCls, 'flex-1 sm:flex-none')} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} aria-label="Filter by category">
          <option value="All">All categories</option>
          {CATEGORY_NAMES.filter((c) => present.has(c)).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={cx(selectCls, 'flex-1 sm:flex-none')} value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })} aria-label="Filter by difficulty">
          <option value="All">All levels</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.name}>{d.name}</option>
          ))}
        </select>
        {active && (
          <button onClick={() => setFilters(emptyFilters)} className="flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-navy-500 hover:bg-navy-100" aria-label="Clear filters">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
      {total != null && <div className="hidden whitespace-nowrap text-sm text-navy-400 xl:block">{total} shown</div>}
    </div>
  );
}
