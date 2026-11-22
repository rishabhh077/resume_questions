import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileUp, Wand2, Mic, Bookmark, History, Settings, Menu, X, Sparkles, FlaskConical } from 'lucide-react';
import { Logo, cx } from '../ui';
import { useApp } from '../../context/AppContext';

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/upload', label: 'Upload Resume', icon: FileUp },
  { to: '/app/generate', label: 'Generate Questions', icon: Wand2 },
  { to: '/app/mock', label: 'Mock Interview', icon: Mic },
  { to: '/app/saved', label: 'Saved Questions', icon: Bookmark },
  { to: '/app/history', label: 'Interview History', icon: History },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

function ModeBadge() {
  const { aiActive, health } = useApp();
  if (!health.checked) return null;
  return (
    <Link
      to="/app/settings"
      className={cx(
        'flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ring-1 transition hover:brightness-95',
        aiActive ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-amber-50 text-amber-800 ring-amber-200'
      )}
    >
      {aiActive ? <Sparkles className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
      <span className="flex-1">{aiActive ? 'Claude AI connected' : 'Demo mode'}</span>
      <span className={cx('h-1.5 w-1.5 rounded-full', aiActive ? 'bg-emerald-500' : 'bg-amber-500')} />
    </Link>
  );
}

function SidebarContent({ onNavigate }) {
  const { state } = useApp();
  const saved = state.sessions.reduce((n, s) => n + s.questions.filter((q) => q.bookmarked).length, 0);
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="px-5 pb-6 pt-5" onClick={onNavigate}>
        <Logo />
      </Link>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all',
                isActive ? 'bg-white text-navy-900 shadow-card ring-1 ring-navy-100' : 'text-navy-500 hover:bg-white/70 hover:text-navy-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cx('h-[18px] w-[18px]', isActive ? 'text-brand-600' : 'text-navy-400 group-hover:text-navy-600')} />
                <span className="flex-1">{label}</span>
                {label === 'Saved Questions' && saved > 0 && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">{saved}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 p-4">
        {state.resume && (
          <div className="rounded-xl bg-white p-3 ring-1 ring-navy-100">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Active resume</div>
            <div className="mt-0.5 truncate text-sm font-medium text-navy-800">{state.analysis?.name || state.resume.fileName}</div>
          </div>
        )}
        <ModeBadge />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => (document.body.style.overflow = '');
  }, [open]);

  return (
    <div className="min-h-screen bg-navy-50/60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-navy-100 bg-navy-50/80 backdrop-blur lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-navy-100 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link to="/">
          <Logo />
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-navy-600 hover:bg-navy-100" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={cx('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div className={cx('absolute inset-0 bg-navy-950/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <aside
          className={cx(
            'absolute inset-y-0 left-0 w-72 max-w-[85%] bg-navy-50 shadow-lift transition-transform duration-300',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-navy-500 hover:bg-navy-100" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
