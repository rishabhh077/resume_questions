import { useRef, useState } from 'react';
import { Sparkles, FlaskConical, RefreshCw, Download, Upload, Trash2, Database, SlidersHorizontal, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, PageHeader, Chip, Alert, Label, cx } from '../components/ui';
import { useApp } from '../context/AppContext';
import { CATEGORIES, DIFFICULTIES, COUNTS } from '../lib/constants';
import { useLoadDemo } from '../lib/demoLoader';

function Section({ icon: Icon, title, description, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 font-display font-semibold text-navy-900">
          <Icon className="h-4 w-4 text-brand-500" />
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function StatusRow({ ok, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-navy-300" />}
      <span className={ok ? 'text-navy-800' : 'text-navy-500'}>{label}</span>
    </div>
  );
}

export default function Settings() {
  const { state, dispatch, health, refreshHealth, aiActive, toast } = useApp();
  const { settings } = state;
  const fileRef = useRef(null);
  const [checking, setChecking] = useState(false);
  const set = (s) => dispatch({ type: 'SET_SETTINGS', settings: s });

  const recheck = async () => {
    setChecking(true);
    const h = await refreshHealth();
    setChecking(false);
    toast(h.aiEnabled ? 'Claude API is connected' : h.serverUp ? 'Server is running without an API key' : 'Backend server is not reachable');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviewprep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded');
  };

  const importData = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.sessions)) throw new Error();
      dispatch({ type: 'IMPORT', data });
      toast('Data imported');
    } catch {
      toast('That file is not a valid InterviewPrep backup', 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const loadDemo = useLoadDemo();
  const loadSample = () => loadDemo('/app/dashboard');

  const clearAll = () => {
    if (!window.confirm('Delete your resume, all question sets, bookmarks and mock interviews from this browser? This cannot be undone.')) return;
    dispatch({ type: 'RESET' });
    toast('All data cleared');
  };

  const toggleCat = (name) => {
    const cur = settings.defaultCategories;
    const next = cur.includes(name) ? cur.filter((c) => c !== name) : [...cur, name];
    if (next.length) set({ defaultCategories: next });
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Settings" description="Control how questions are generated and manage your data." />

      <Section icon={Cpu} title="AI engine" description="Claude generates and evaluates when the server has an API key. Demo mode works offline with template-based questions and rule-based scoring.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['auto', 'Claude AI', 'Use Claude whenever the server has an API key.', Sparkles],
            ['demo', 'Demo mode', 'Always use the offline demo engine.', FlaskConical],
          ].map(([id, t, d, Icon]) => (
            <button
              key={id}
              onClick={() => set({ mode: id })}
              aria-pressed={settings.mode === id}
              className={cx('rounded-xl p-4 text-left ring-1 transition', settings.mode === id ? 'bg-brand-50 ring-2 ring-brand-400' : 'bg-white ring-navy-200 hover:ring-navy-300')}
            >
              <div className="flex items-center gap-2 font-semibold text-navy-900">
                <Icon className="h-4 w-4 text-brand-600" /> {t}
              </div>
              <div className="mt-1 text-sm text-navy-500">{d}</div>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-4 rounded-xl bg-navy-50 p-4 ring-1 ring-navy-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <StatusRow ok={health.serverUp} label={health.serverUp ? 'Backend server running' : 'Backend server not reachable'} />
            <StatusRow ok={health.aiEnabled} label={health.aiEnabled ? `API key configured (${health.model})` : 'No ANTHROPIC_API_KEY on the server'} />
            <StatusRow ok={aiActive} label={aiActive ? 'Using Claude for generation' : 'Using demo mode'} />
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={recheck} loading={checking}>
            Re-check
          </Button>
        </div>
        {settings.mode === 'auto' && !health.aiEnabled && health.checked && (
          <div className="mt-4">
            <Alert tone="info" title="Enable Claude AI">
              Copy <code className="rounded bg-white/70 px-1">.env.example</code> to <code className="rounded bg-white/70 px-1">.env</code>, add your <code className="rounded bg-white/70 px-1">ANTHROPIC_API_KEY</code>, then restart with{' '}
              <code className="rounded bg-white/70 px-1">npm run dev</code>. The key stays on the server and is never sent to the browser.
            </Alert>
          </div>
        )}
      </Section>

      <Section icon={SlidersHorizontal} title="Generation defaults" description="Pre-selected options on the Generate page.">
        <div className="space-y-5">
          <div>
            <Label>Default difficulty</Label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Chip key={d.name} active={settings.defaultDifficulty === d.name} onClick={() => set({ defaultDifficulty: d.name })}>
                  {d.name}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Default number of questions</Label>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((n) => (
                <Chip key={n} active={settings.defaultCount === n} onClick={() => set({ defaultCount: n })}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>Default categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c.name} active={settings.defaultCategories.includes(c.name)} onClick={() => toggleCat(c.name)} icon={c.icon}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Database} title="Your data" description="Everything is stored locally in this browser. Nothing is kept on the server.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Download} onClick={exportData}>
            Export backup
          </Button>
          <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
            Import backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          <Button variant="secondary" icon={Sparkles} onClick={loadSample}>
            Load sample data
          </Button>
          <Button variant="danger" icon={Trash2} onClick={clearAll}>
            Clear all data
          </Button>
        </div>
        <div className="mt-4 text-xs text-navy-400">
          {state.sessions.length} question sets · {state.mocks.length} mock interviews · {state.resume ? '1 resume' : 'no resume'}
        </div>
      </Section>
    </div>
  );
}
