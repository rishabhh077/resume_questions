import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  FileUp,
  ScanSearch,
  Wand2,
  Mic,
  Target,
  MessagesSquare,
  ShieldCheck,
  FileDown,
  Bookmark,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Brain,
  FileText,
  Star,
} from 'lucide-react';
import { Button, Logo, Badge, RichAnswer, cx } from '../components/ui';
import { useLoadDemo } from '../lib/demoLoader';
import { categoryMeta } from '../lib/constants';

const STEPS = [
  [FileUp, 'Upload your resume', 'Drop in a PDF or DOCX, or paste your resume text.'],
  [ScanSearch, 'AI analyzes your profile', 'Skills, experience, projects and the things interviewers will notice.'],
  [Wand2, 'Get tailored questions', 'Pick a role, categories and difficulty. Every question comes with a personalized answer.'],
  [Mic, 'Practice and improve', 'Answer in a mock interview and get scored feedback with an improved answer.'],
];

const FEATURES = [
  [Target, 'Resume-specific questions', 'Questions that name your actual projects, tools and achievements, not generic lists.'],
  [MessagesSquare, '10 interview categories', 'From personal introduction and HR to technical, scenario, leadership and tricky questions.'],
  [Brain, 'Answers that coach you', 'Sample answer, why it’s asked, key points, mistakes to avoid and likely follow-ups.'],
  [ShieldCheck, 'Never invents your experience', 'Gaps are clearly highlighted for you to fill in with your own real details.'],
  [Mic, 'AI mock interviews', 'Scored on clarity, relevance, confidence and structure, with a final report.'],
  [BarChart3, 'Job description matching', 'See matched and missing skills and prepare for the gaps before they ask.'],
  [Bookmark, 'Save & organize', 'Bookmark questions, filter by category and difficulty, and track progress.'],
  [FileDown, 'PDF prep reports', 'Download your questions and mock interview results to review anywhere.'],
];

const EXAMPLES = [
  {
    category: 'Resume-Based',
    difficulty: 'Intermediate',
    question: 'Your resume says you cut dashboard load time from 4.2s to 1.6s. Walk me through exactly how you did that.',
    ref: 'Software Engineer II at Finlytics',
    answer:
      'At Finlytics, the customer dashboard was our most-used page, and slow loads were showing up in support tickets. I owned the rebuild in React and TypeScript. I profiled it first and found [ADD: the main bottlenecks you measured], then split the bundle by route, memoized expensive charts and moved portfolio summaries behind a Redis cache. That’s how we got from 4.2s to 1.6s, measured with [ADD: the tool you used, e.g. Lighthouse or RUM data].',
    why: 'Interviewers verify headline metrics and check how much of the work was personally yours.',
  },
  {
    category: 'Project-Based',
    difficulty: 'Advanced',
    question: 'In ShopSphere you used WebSockets for live stock updates. What happens when 10,000 clients connect at once?',
    ref: 'Project: ShopSphere',
    answer:
      'A single Node process on EC2 would hit connection and memory limits first. I’d scale horizontally behind a load balancer with sticky sessions, and use Redis pub/sub so every instance broadcasts stock changes. I’d also batch updates per product rather than per event, and add [ADD: the monitoring you would set up] to track connection counts and message lag.',
    why: 'Tests whether you understand the scaling limits of a system you built.',
  },
  {
    category: 'Tricky Questions',
    difficulty: 'Intermediate',
    question: 'This role needs accessibility (WCAG) experience, which isn’t on your resume. How would you handle that?',
    ref: 'Missing skill: Accessibility',
    answer:
      'You’re right that I haven’t owned accessibility work in production. What I do have is deep React experience and a habit of measuring everything, which is exactly how I’d approach it. I’ve started [ADD: what you are doing to learn, e.g. auditing my projects with axe], and when I picked up Redis caching I went from zero to shipping in [ADD: time frame].',
    why: 'Checks honesty about gaps and your ability to learn quickly.',
  },
];

const FAQ = [
  ['Is my resume stored anywhere?', 'Your resume and results are saved only in your own browser (local storage). When AI is enabled, the text is sent to the server just to generate questions and is not stored there.'],
  ['Will the AI make up experience I don’t have?', 'No. Answers are built only from what’s in your resume. Anywhere a real detail is needed, like a metric or a story, you’ll see a highlighted placeholder to fill in yourself.'],
  ['What file types are supported?', 'PDF and DOCX up to 5 MB. You can also paste plain text. Scanned image PDFs can’t be read, so paste the text instead.'],
  ['Does it work for non-technical roles?', 'Yes. The question categories and answers adapt to any role: sales, marketing, design, operations, finance, product and more.'],
  ['How does the mock interview score me?', 'Each answer gets a score out of 10, plus separate scores for clarity, relevance, confidence and structure, specific feedback and an improved version of your answer.'],
  ['Can I try it without an API key?', 'Yes. Demo mode works fully offline with template-based questions and rule-based scoring. Add a Claude API key on the server for fully AI-generated results.'],
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gradient opacity-20 blur-3xl" />
      <div className="rounded-2xl bg-white p-4 shadow-lift ring-1 ring-navy-100 sm:p-5">
        <div className="flex items-center gap-3 rounded-xl bg-navy-50 p-3 ring-1 ring-navy-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white ring-1 ring-navy-100">
            <FileText className="h-5 w-5 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-navy-900">Aarav_Mehta_Resume.pdf</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Analyzed · 3.5 yrs · 15 skills
            </div>
          </div>
          <Badge className="bg-brand-50 text-brand-700 ring-brand-200">78% match</Badge>
        </div>
        <div className="mt-3 space-y-2.5">
          {EXAMPLES.slice(0, 2).map((e, i) => {
            const c = categoryMeta(e.category);
            return (
              <div key={i} className={cx('rounded-xl p-3.5 ring-1', i === 0 ? 'bg-white ring-brand-200 shadow-card' : 'bg-white ring-navy-100')}>
                <div className="mb-1.5 flex gap-1.5">
                  <Badge className={c.color} icon={c.icon}>
                    {e.category}
                  </Badge>
                  <Badge>{e.difficulty}</Badge>
                </div>
                <div className="text-sm font-semibold leading-snug text-navy-900">{e.question}</div>
                {i === 0 && (
                  <div className="mt-2.5 rounded-lg bg-brand-soft p-2.5 text-xs leading-relaxed text-navy-700 ring-1 ring-brand-100">
                    <span className="font-semibold text-brand-700">Sample answer: </span>
                    At Finlytics, the customer dashboard was our most-used page… I profiled it first and found{' '}
                    <mark className="rounded bg-amber-100 px-1 text-amber-800">✎ the bottlenecks you measured</mark>…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl bg-white p-3 shadow-lift ring-1 ring-navy-100 sm:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-display text-sm font-bold text-emerald-600 ring-4 ring-emerald-100">8.5</div>
        <div>
          <div className="text-xs font-semibold text-navy-900">Mock interview score</div>
          <div className="text-[11px] text-navy-500">Strong structure & relevance</div>
        </div>
      </div>
    </div>
  );
}

function ExampleCard({ e }) {
  const [open, setOpen] = useState(false);
  const c = categoryMeta(e.category);
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-navy-100 transition hover:shadow-lift">
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge className={c.color} icon={c.icon}>
          {e.category}
        </Badge>
        <Badge>{e.difficulty}</Badge>
      </div>
      <h3 className="font-semibold leading-snug text-navy-900">{e.question}</h3>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-navy-400">
        <FileText className="h-3.5 w-3.5" /> Based on: {e.ref}
      </div>
      <p className="mt-3 text-sm text-navy-500">
        <span className="font-medium text-navy-700">Why they ask: </span>
        {e.why}
      </p>
      <div className="mt-auto pt-4">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
          {open ? 'Hide' : 'Show'} sample answer <ChevronDown className={cx('h-4 w-4 transition', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="mt-3 animate-fade-up rounded-xl bg-brand-soft p-3.5 ring-1 ring-brand-100">
            <RichAnswer text={e.answer} className="text-sm text-navy-700" />
          </div>
        )}
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-navy-100">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 py-5 text-left" aria-expanded={open}>
        <span className="font-semibold text-navy-900">{q}</span>
        <ChevronDown className={cx('h-5 w-5 shrink-0 text-navy-400 transition', open && 'rotate-180 text-brand-500')} />
      </button>
      {open && <p className="-mt-1 animate-fade-up pb-5 pr-8 leading-relaxed text-navy-600">{a}</p>}
    </div>
  );
}

export default function Landing() {
  const loadDemo = useLoadDemo();
  const tryDemo = () => loadDemo();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-navy-100/70 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-navy-500 md:flex">
            <a href="#how" className="hover:text-navy-900">How it works</a>
            <a href="#features" className="hover:text-navy-900">Features</a>
            <a href="#examples" className="hover:text-navy-900">Examples</a>
            <a href="#faq" className="hover:text-navy-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app/dashboard" className="hidden sm:block">
              <Button variant="ghost" size="sm">Open app</Button>
            </Link>
            <Link to="/app/upload">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="absolute left-1/2 top-0 -z-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:pb-28">
          <div className="animate-fade-up">
            <Badge className="bg-white text-brand-700 ring-brand-200 shadow-sm" icon={Sparkles}>
              AI interview coach, powered by Claude
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy-900 text-balance sm:text-5xl lg:text-[56px]">
              Turn Your Resume Into Your{' '}
              <span className="bg-brand-gradient bg-clip-text text-transparent">Interview Superpower.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-500">
              Upload your resume. Discover the questions recruiters will ask. Practice with AI-powered answers and ace your next interview.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/app/upload">
                <Button size="lg" className="w-full sm:w-auto">
                  Generate My Interview Questions <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="secondary" icon={Play} onClick={tryDemo}>
                Try a Demo
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-500">
              {['No sign-up required', 'PDF & DOCX', 'Private by default'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-y border-navy-100 bg-navy-50/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-brand-600">How it works</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">From resume to ready in minutes</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([Icon, t, d], i) => (
              <div key={t} className="relative rounded-2xl bg-white p-6 shadow-card ring-1 ring-navy-100">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-extrabold text-navy-100">0{i + 1}</span>
                </div>
                <h3 className="font-display font-semibold text-navy-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-brand-600">Features</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Everything you need to prepare with confidence</h2>
            <p className="mt-3 text-lg text-navy-500">Built like an experienced recruiter and interview coach would prepare you.</p>
          </div>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([Icon, t, d]) => (
              <div key={t}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-600 ring-1 ring-brand-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-navy-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="scroll-mt-16 bg-navy-900 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-brand-300">Example questions</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Questions that sound like they read your resume</h2>
            <p className="mt-3 text-lg text-navy-300">Generated from a sample full-stack developer resume and a Senior Frontend Engineer job description.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {EXAMPLES.map((e) => (
              <ExampleCard key={e.question} e={e} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button size="lg" variant="secondary" icon={Play} onClick={tryDemo}>
              Explore the full demo
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-brand-600">Benefits</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Walk in knowing what they’ll ask</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-500">
              Most candidates prepare with generic question lists. Interviewers ask about <em>your</em> resume. InterviewPrep AI closes that gap.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                [Zap, 'Prepare 10x faster', 'Skip hours of searching for questions.'],
                [Target, 'No surprises', 'Rehearse the exact claims they’ll probe.'],
                [Star, 'Stronger answers', 'STAR-structured, concise and authentic.'],
                [Clock, 'Practice anytime', 'Mock interviews on your schedule.'],
              ].map(([Icon, t, d]) => (
                <div key={t} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-navy-900">{t}</div>
                    <div className="text-sm text-navy-500">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-brand-soft p-6 ring-1 ring-brand-100 sm:p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['10', 'question categories'],
                ['4', 'difficulty levels'],
                ['50', 'questions per set'],
                ['4', 'scoring dimensions'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-white p-5 shadow-card ring-1 ring-navy-100">
                  <div className="font-display text-4xl font-extrabold text-navy-900">{n}</div>
                  <div className="mt-1 text-sm text-navy-500">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-t border-navy-100 bg-navy-50/50 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-wider text-brand-600">FAQ</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Questions, answered</h2>
          </div>
          <div className="mt-10 rounded-2xl bg-white px-5 shadow-card ring-1 ring-navy-100 sm:px-8">
            {FAQ.map(([q, a]) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center shadow-glow sm:px-12">
            <div className="bg-grid absolute inset-0 opacity-20" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Your next interview starts with your resume</h2>
              <p className="mx-auto mt-3 max-w-xl text-lg text-white/80">Upload it now and see the questions recruiters are most likely to ask.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/app/upload">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Generate My Interview Questions <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" icon={Play} onClick={tryDemo}>
                  Try a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-navy-400">AI-powered interview preparation from your resume.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-500">
            <Link to="/app/dashboard" className="hover:text-navy-900">Dashboard</Link>
            <Link to="/app/upload" className="hover:text-navy-900">Upload resume</Link>
            <Link to="/app/mock" className="hover:text-navy-900">Mock interview</Link>
            <a href="#faq" className="hover:text-navy-900">FAQ</a>
          </div>
          <div className="text-sm text-navy-400">© {new Date().getFullYear()} InterviewPrep AI</div>
        </div>
      </footer>
    </div>
  );
}
