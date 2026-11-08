import { ArrowUpRight, Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { QueryResult } from '../lib/types';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span>
          upskilling<span className="brand-dot">.</span>
        </span>
      )}
    </div>
  );
}
export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  action,
  onClick,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-button" onClick={onClick}>
          {action}
          <ArrowUpRight size={16} />
        </button>
      )}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const container = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const elements = Array.from(
        container.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled):not([hidden]), select, textarea, [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0 && !element.matches(':disabled'));
      if (!elements?.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', listener);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={container}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose} autoFocus>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function DataTable({
  result,
  empty = 'No rows returned.',
}: {
  result: QueryResult;
  empty?: string;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {result.columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.values.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v === null ? <span className="null-value">NULL</span> : String(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!result.values.length && <p className="table-empty">{empty}</p>}
    </div>
  );
}
export function Status({ value }: { value: number }) {
  return (
    <span className={`status ${value === 100 ? 'mastered' : value > 0 ? 'practicing' : 'new'}`}>
      {value === 100 ? (
        <>
          <Check size={12} />
          Mastered
        </>
      ) : value > 0 ? (
        'In progress'
      ) : (
        'Not started'
      )}
    </span>
  );
}
