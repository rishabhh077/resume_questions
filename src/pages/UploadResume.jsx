import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, X, RefreshCw, ClipboardPaste, CheckCircle2, Loader2, ScanSearch, ArrowRight, Sparkles, Trash2 } from 'lucide-react';
import { Button, Card, PageHeader, Textarea, Alert, Skeleton, cx } from '../components/ui';
import ResumeSummary from '../components/ResumeSummary';
import { useApp } from '../context/AppContext';
import { extractText, validateFile, cleanText } from '../lib/parser';
import { api } from '../lib/api';
import { SAMPLE_RESUME } from '../lib/sampleData';
import { MAX_FILE_MB } from '../lib/constants';

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function UploadResume() {
  const { state, dispatch, toast } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [tab, setTab] = useState(state.resume?.source === 'paste' ? 'paste' : 'upload');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | reading | analyzing
  const [error, setError] = useState('');
  const [pasted, setPasted] = useState(state.resume?.source === 'paste' ? state.resume.text : '');
  const [showText, setShowText] = useState(false);
  const [draft, setDraft] = useState(state.resume?.text || '');

  const analyze = async (text) => {
    setStatus('analyzing');
    setError('');
    try {
      const res = await api.analyze(state.settings.mode, { resumeText: text });
      dispatch({ type: 'SET_ANALYSIS', analysis: res.analysis, source: res.source });
      if (res.fellBack) toast('AI unavailable, used demo analysis');
      else toast('Resume analyzed');
    } catch (e) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  const handleFile = async (file) => {
    setError('');
    const v = validateFile(file);
    if (v) return setError(v);
    setStatus('reading');
    try {
      const text = await extractText(file);
      const resume = { fileName: file.name, fileSize: file.size, source: 'file', text, uploadedAt: new Date().toISOString() };
      dispatch({ type: 'SET_RESUME', resume });
      setDraft(text);
      await analyze(text);
    } catch (e) {
      setError(e.message);
      setStatus('idle');
    }
  };

  const usePasted = async () => {
    const text = cleanText(pasted);
    if (text.length < 80) return setError('Please paste your full resume (at least a few lines).');
    dispatch({ type: 'SET_RESUME', resume: { fileName: 'Pasted resume', fileSize: text.length, source: 'paste', text, uploadedAt: new Date().toISOString() } });
    setDraft(text);
    await analyze(text);
  };

  const useSample = async () => {
    setTab('paste');
    setPasted(SAMPLE_RESUME);
    dispatch({ type: 'SET_RESUME', resume: { fileName: 'Sample resume (Aarav Mehta)', fileSize: SAMPLE_RESUME.length, source: 'sample', text: SAMPLE_RESUME, uploadedAt: new Date().toISOString() } });
    setDraft(SAMPLE_RESUME);
    await analyze(SAMPLE_RESUME);
  };

  const saveEdits = async () => {
    const text = cleanText(draft);
    if (text.length < 80) return setError('Resume text is too short.');
    dispatch({ type: 'SET_RESUME', resume: { ...state.resume, text } });
    setShowText(false);
    await analyze(text);
  };

  const remove = () => {
    dispatch({ type: 'CLEAR_RESUME' });
    setPasted('');
    setDraft('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    toast('Resume removed');
  };

  const busy = status !== 'idle';
  const r = state.resume;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Step 1"
        title="Upload your resume"
        description="We read your resume, pull out your skills, experience and projects, and use them to predict what recruiters will ask."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card className="p-1.5">
            <div className="grid grid-cols-2 gap-1">
              {[
                ['upload', 'Upload file', UploadCloud],
                ['paste', 'Paste text', ClipboardPaste],
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cx(
                    'flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition',
                    tab === id ? 'bg-navy-900 text-white shadow' : 'text-navy-500 hover:bg-navy-50'
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </Card>

          {tab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => !busy && inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              className={cx(
                'relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all',
                dragging ? 'border-brand-400 bg-brand-50/70 scale-[1.01]' : 'border-navy-200 bg-white hover:border-brand-300 hover:bg-brand-50/30',
                busy && 'pointer-events-none'
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className={cx('mb-4 flex h-14 w-14 items-center justify-center rounded-2xl', dragging ? 'bg-brand-gradient text-white shadow-glow' : 'bg-brand-soft text-brand-600 ring-1 ring-brand-100')}>
                {status === 'reading' ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <div className="font-display text-lg font-semibold text-navy-900">{status === 'reading' ? 'Reading your resume…' : dragging ? 'Drop it here' : 'Drag & drop your resume'}</div>
              <p className="mt-1 text-sm text-navy-500">
                or <span className="font-medium text-brand-600">browse files</span> · PDF or DOCX, up to {MAX_FILE_MB} MB
              </p>
            </div>
          ) : (
            <Card className="p-4">
              <Textarea
                rows={12}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Paste the full text of your resume here: summary, experience, projects, skills, education…"
                aria-label="Paste resume text"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-navy-400">{pasted.trim().split(/\s+/).filter(Boolean).length} words</span>
                <Button onClick={usePasted} loading={status === 'analyzing'} icon={ScanSearch} disabled={busy || !pasted.trim()}>
                  Analyze resume
                </Button>
              </div>
            </Card>
          )}

          {error && (
            <Alert tone="error" title="Something went wrong" action={<button onClick={() => setError('')} aria-label="Dismiss"><X className="h-4 w-4" /></button>}>
              {error}
            </Alert>
          )}

          {r && (
            <Card className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 ring-1 ring-navy-100">
                <FileText className="h-5 w-5 text-navy-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-navy-900">{r.fileName}</div>
                <div className="flex items-center gap-1.5 text-xs text-navy-500">
                  {status === 'analyzing' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-brand-500" /> Analyzing with {state.settings.mode === 'demo' ? 'demo engine' : 'AI'}…
                    </>
                  ) : state.analysis ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Analyzed · {r.source === 'file' ? fmtSize(r.fileSize) : `${r.text.split(/\s+/).length} words`}
                    </>
                  ) : (
                    'Uploaded · not analyzed yet'
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setTab('upload'); setTimeout(() => inputRef.current?.click(), 50); }} title="Replace resume" aria-label="Replace resume" disabled={busy}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={remove} title="Remove resume" aria-label="Remove resume" disabled={busy}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {r && (
            <Card className="p-4">
              <button onClick={() => { setShowText((s) => !s); setDraft(r.text); }} className="flex w-full items-center justify-between text-sm font-semibold text-navy-800">
                Extracted text
                <span className="text-xs font-medium text-brand-600">{showText ? 'Hide' : 'View & edit'}</span>
              </button>
              {showText && (
                <div className="mt-3 animate-fade-up">
                  <Textarea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} className="font-mono text-[13px]" aria-label="Extracted resume text" />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setShowText(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveEdits} loading={status === 'analyzing'} disabled={draft === r.text}>
                      Save & re-analyze
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-display font-semibold text-navy-900">Tips for the best results</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-navy-600">
              {[
                'Use a text-based PDF or DOCX (not a scanned image).',
                'Include measurable results: they become great questions.',
                'List projects with the tech you used.',
                'Your resume stays in your browser; it is only sent to the AI for analysis.',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="bg-brand-soft p-5 ring-brand-100">
            <div className="flex items-center gap-2 font-display font-semibold text-navy-900">
              <Sparkles className="h-4 w-4 text-brand-600" /> No resume handy?
            </div>
            <p className="mt-1.5 text-sm text-navy-600">Try the app with a realistic sample resume of a full-stack developer.</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={useSample} disabled={busy}>
              Use sample resume
            </Button>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        {status === 'analyzing' && !state.analysis && (
          <Card className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </Card>
        )}
        {state.analysis && (
          <div className="animate-fade-up space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-navy-900">Resume analysis</h2>
              <Button onClick={() => navigate('/app/generate')} icon={ArrowRight} className="flex-row-reverse">
                Continue to questions
              </Button>
            </div>
            <ResumeSummary analysis={state.analysis} source={state.analysisSource} />
          </div>
        )}
      </div>
    </div>
  );
}
