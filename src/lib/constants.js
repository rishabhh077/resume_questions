import {
  UserRound,
  Briefcase,
  Code2,
  FileText,
  FolderGit2,
  MessagesSquare,
  Route,
  Puzzle,
  Users,
  Zap,
} from 'lucide-react';

export const CATEGORIES = [
  { name: 'Personal Introduction', short: 'Intro', icon: UserRound, color: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { name: 'HR Interview', short: 'HR', icon: Briefcase, color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { name: 'Technical', short: 'Technical', icon: Code2, color: 'bg-brand-50 text-brand-700 ring-brand-200' },
  { name: 'Resume-Based', short: 'Resume', icon: FileText, color: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  { name: 'Project-Based', short: 'Projects', icon: FolderGit2, color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { name: 'Behavioral', short: 'Behavioral', icon: MessagesSquare, color: 'bg-rose-50 text-rose-700 ring-rose-200' },
  { name: 'Scenario-Based', short: 'Scenario', icon: Route, color: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  { name: 'Problem-Solving', short: 'Problem', icon: Puzzle, color: 'bg-violet-50 text-violet-700 ring-violet-200' },
  { name: 'Leadership & Teamwork', short: 'Leadership', icon: Users, color: 'bg-teal-50 text-teal-700 ring-teal-200' },
  { name: 'Tricky Questions', short: 'Tricky', icon: Zap, color: 'bg-orange-50 text-orange-700 ring-orange-200' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
export const categoryMeta = (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[3];

export const DIFFICULTIES = [
  { name: 'Beginner', desc: 'Fundamentals and straightforward questions', dot: 'bg-emerald-500' },
  { name: 'Intermediate', desc: 'Applied questions needing real examples', dot: 'bg-sky-500' },
  { name: 'Advanced', desc: 'Depth, trade-offs and edge cases', dot: 'bg-brand-500' },
  { name: 'Expert', desc: 'System thinking and hard follow-ups', dot: 'bg-rose-500' },
];
export const difficultyMeta = (name) => DIFFICULTIES.find((d) => d.name === name) || DIFFICULTIES[1];

export const COUNTS = [10, 20, 30, 50];

export const DEFAULT_CATEGORIES = ['Personal Introduction', 'Technical', 'Resume-Based', 'Project-Based', 'Behavioral', 'Tricky Questions'];

export const MAX_FILE_MB = 5;
