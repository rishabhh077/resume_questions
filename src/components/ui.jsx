import { forwardRef } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const VARIANTS = {
  primary: 'bg-brand-gradient text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary: 'bg-white text-navy-800 ring-1 ring-navy-200 hover:bg-navy-50 hover:ring-navy-300',
  ghost: 'text-navy-600 hover:bg-navy-100/70 hover:text-navy-900',
  danger: 'bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};
const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg justify-center',
};

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, disabled, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cx('rounded-2xl bg-white ring-1 ring-navy-100 shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({ className, children, icon: Icon }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', className || 'bg-navy-50 text-navy-600 ring-navy-200')}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Label({ children, htmlFor, hint }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-navy-800">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-navy-400">{hint}</span>}
    </label>
  );
}

const fieldCls =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] text-navy-900 ring-1 ring-navy-200 placeholder:text-navy-300 transition focus:outline-none focus:ring-2 focus:ring-brand-400';

export const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} className={cx(fieldCls, 'h-11', props.className)} />;
});
export const Textarea = forwardRef(function Textarea(props, ref) {
  return <textarea ref={ref} {...props} className={cx(fieldCls, 'resize-y leading-relaxed', props.className)} />;
});

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft ring-1 ring-brand-100">
        <Icon className="h-6 w-6 text-brand-600" />
      </div>
      <h3 className="font-display text-lg font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function ProgressBar({ value, className }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-navy-100', className)}>
      <div className="h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ScoreRing({ value, max = 10, size = 96, stroke = 9, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const color = pct >= 0.75 ? '#10b981' : pct >= 0.5 ? '#6634ef' : pct >= 0.3 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9edf5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-xl font-bold text-navy-900">
          {Number.isInteger(value) ? value : value.toFixed(1)}
          <span className="text-sm font-medium text-navy-400">/{max}</span>
        </div>
        {label && <div className="text-[10px] font-medium uppercase tracking-wide text-navy-400">{label}</div>}
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('animate-shimmer rounded-lg bg-[linear-gradient(90deg,#eef1f7_0%,#f7f8fc_50%,#eef1f7_100%)] bg-[length:800px_100%]', className)} />;
}

export function Alert({ tone = 'info', title, children, action }) {
  const tones = {
    info: ['bg-sky-50 ring-sky-200 text-sky-900', Info, 'text-sky-500'],
    warn: ['bg-amber-50 ring-amber-200 text-amber-900', AlertTriangle, 'text-amber-500'],
    error: ['bg-rose-50 ring-rose-200 text-rose-900', AlertTriangle, 'text-rose-500'],
    success: ['bg-emerald-50 ring-emerald-200 text-emerald-900', CheckCircle2, 'text-emerald-500'],
  };
  const [cls, Icon, iconCls] = tones[tone];
  return (
    <div className={cx('flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1', cls)} role={tone === 'error' ? 'alert' : undefined}>
      <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', iconCls)} />
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto flex animate-fade-up items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lift ring-1',
            t.tone === 'error' ? 'bg-rose-600 text-white ring-rose-700' : 'bg-navy-900 text-white ring-navy-800'
          )}
        >
          {t.tone === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ring-1 transition-all',
        active ? 'bg-brand-50 text-brand-700 ring-brand-300 shadow-sm' : 'bg-white text-navy-600 ring-navy-200 hover:ring-navy-300 hover:bg-navy-50'
      )}
    >
      {Icon && <Icon className={cx('h-4 w-4', active ? 'text-brand-600' : 'text-navy-400')} />}
      {children}
    </button>
  );
}

export function Logo({ className, compact }) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
          <path d="M9 11.5h12M9 16h8M9 20.5h5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="21.5" cy="20.5" r="2.7" fill="#fff" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight text-navy-900">
          InterviewPrep <span className="bg-brand-gradient bg-clip-text text-transparent">AI</span>
        </span>
      )}
    </div>
  );
}

/** Renders text, highlighting [ADD: ...] placeholders the user must personalize. */
export function RichAnswer({ text, className }) {
  const parts = String(text || '').split(/(\[ADD:[^\]]*\])/g);
  return (
    <p className={cx('whitespace-pre-line leading-relaxed', className)}>
      {parts.map((p, i) =>
        p.startsWith('[ADD:') ? (
          <mark key={i} className="rounded-md bg-amber-100 px-1 py-0.5 text-[0.95em] font-medium text-amber-800 ring-1 ring-amber-200">
            {p.slice(1, -1).replace(/^ADD:\s*/, '✎ ')}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </p>
  );
}
