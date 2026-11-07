import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Code2,
  Download,
  LayoutDashboard,
  Leaf,
  Menu,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import LearningPath from './components/LearningPath';
import Study from './components/Study';
import ProgressView from './components/Progress';
import { Brand, Modal, ProgressBar } from './components/ui';
import {
  emptyProgress,
  loadProgress,
  parseProgress,
  STORAGE_KEY,
  todayAttempts,
} from './lib/progress';
import type { Attempt } from './lib/types';
import { recordAttempt } from './lib/progress';
const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'path', label: 'Learning path', icon: BookOpen },
  { id: 'study', label: 'Practice', icon: Code2 },
  { id: 'progress', label: 'My progress', icon: BarChart3 },
];
export default function App() {
  const [page, setPage] = useState(() =>
    ['overview', 'path', 'progress', 'study'].includes(location.hash.slice(1))
      ? location.hash.slice(1)
      : 'overview',
  );
  const [progress, setProgress] = useState(loadProgress);
  const [focus, setFocus] = useState<string>();
  const [sessionKey, setSessionKey] = useState(0);
  const [settings, setSettings] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false);
  const [message, setMessage] = useState(''),
    [storageError, setStorageError] = useState('');
  const [reset, setReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError('');
    } catch {
      setStorageError(
        'Your browser could not save progress. Export a backup before closing this page.',
      );
    }
  }, [progress]);
  useEffect(() => {
    const listener = () => {
      const p = location.hash.slice(1);
      if (nav.some((n) => n.id === p)) setPage(p);
    };
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    if (!settings) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettings(false);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [settings]);
  const navigate = (p: string) => {
    setPage(p);
    location.hash = p;
    setMobileMenu(false);
    window.scrollTo(0, 0);
  };
  const start = (id?: string) => {
    setFocus(id);
    setSessionKey((k) => k + 1);
    navigate('study');
  };
  const record = (a: Attempt) => setProgress((p) => recordAttempt(p, a));
  const today = new Set(todayAttempts(progress).map((a) => a.questionId)).size;
  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upskilling-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Progress backup downloaded.');
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileMenu(false)}
          >
            <X size={21} />
          </button>
        </div>
        <button className="track-switch" onClick={() => navigate('path')}>
          <span className="sql-badge">
            <DatabaseIcon />
          </span>
          <span>
            <strong>SQL learning track</strong>
            <small>Build your foundations</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              aria-current={page === n.id ? 'page' : undefined}
              onClick={() => (n.id === 'study' ? start() : navigate(n.id))}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {page === n.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-goal">
            <span className="goal-icon">
              <Leaf size={20} />
            </span>
            <strong>Make room for growth.</strong>
            <p>
              A few minutes today.
              <br />A stronger you tomorrow.
            </p>
            <div>
              <span>Daily goal</span>
              <strong>
                {today} / {progress.dailyGoal}
              </strong>
            </div>
            <ProgressBar value={(today / progress.dailyGoal) * 100} />
          </div>
          <button
            className="nav-item settings-link"
            onClick={() => {
              setSettings(true);
              setMessage('');
            }}
          >
            <Settings2 size={18} />
            <span>Preferences</span>
          </button>
          <div className="sidebar-footer">
            <span className="little-leaf">✳</span>Built for the curious.
          </div>
        </div>
      </aside>
      {mobileMenu && <div className="sidebar-shade" onClick={() => setMobileMenu(false)} />}
      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span className="desktop-breadcrumb">
              Workspace<span className="breadcrumb-slash">/</span>
            </span>
            <span>{nav.find((n) => n.id === page)?.label ?? 'Overview'}</span>
          </div>
          <div className="topbar-right">
            <span className="saved-indicator">
              <span />
              {storageError ? 'Save unavailable' : 'Progress saved on this device'}
            </span>
            <button
              className="profile-button"
              aria-label="Open preferences"
              onClick={() => {
                setSettings(true);
                setMessage('');
              }}
            >
              Y<span />
            </button>
          </div>
        </header>
        {storageError && (
          <div className="storage-alert" role="alert">
            {storageError}
            <button onClick={exportData}>Export backup</button>
          </div>
        )}
        <main id="main-content" key={page}>
          {page === 'overview' ? (
            <Dashboard progress={progress} start={start} navigate={navigate} />
          ) : page === 'path' ? (
            <LearningPath progress={progress} start={start} />
          ) : page === 'study' ? (
            <Study
              key={sessionKey}
              progress={progress}
              focus={focus}
              onRecord={record}
              onExit={() => navigate('overview')}
              onRestart={() => start(focus)}
            />
          ) : (
            <ProgressView progress={progress} start={start} />
          )}
        </main>
        <footer className="app-footer">
          <span>Small steps. Lasting knowledge.</span>
          <span>
            <ShieldCheck size={13} />
            Your learning, at your pace.
          </span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map((n) => (
          <button
            key={n.id}
            className={page === n.id ? 'active' : ''}
            onClick={() => (n.id === 'study' ? start() : navigate(n.id))}
          >
            <n.icon size={20} />
            <span>{n.id === 'path' ? 'Learn' : n.id === 'progress' ? 'Progress' : n.label}</span>
          </button>
        ))}
      </nav>
      {settings && (
        <Modal title="Make it your own" onClose={() => setSettings(false)}>
          <div className="settings-section">
            <span className="settings-label">
              <Sparkles size={18} />
              Your daily goal
            </span>
            <p>Choose a sustainable number of questions to practice each day.</p>
            <div className="goal-options">
              {[3, 5, 10, 15].map((n) => (
                <button
                  className={progress.dailyGoal === n ? 'selected' : ''}
                  key={n}
                  onClick={() => setProgress((p) => ({ ...p, dailyGoal: n }))}
                >
                  {n}
                  <small>questions</small>
                  {progress.dailyGoal === n && <Check size={13} />}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-section">
            <span className="settings-label">
              <Download size={18} />
              Keep your progress
            </span>
            <p>
              Progress stays in this browser. Export a backup to move it to another device.
              Importing replaces the progress on this device.
            </p>
            <div className="settings-actions">
              <button className="button secondary" onClick={exportData}>
                <Download size={15} />
                Export backup
              </button>
              <button className="button secondary" onClick={() => fileRef.current?.click()}>
                <Upload size={15} />
                Import backup
              </button>
            </div>
            <input
              type="file"
              accept="application/json,.json"
              hidden
              ref={fileRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 5_000_000) throw new Error('Choose a backup smaller than 5 MB.');
                  const p = parseProgress(await file.text());
                  setProgress(p);
                  setMessage('Progress imported successfully.');
                  navigate('progress');
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : 'Could not read that file.');
                }
                e.target.value = '';
              }}
            />
            {message && (
              <p className="settings-message" role="status">
                {message}
              </p>
            )}
          </div>
          <div className="settings-section">
            <span className="settings-label">
              <MonitorSmartphone size={18} />
              Made for your pocket, too
            </span>
            <p>
              Open this app in your phone browser and choose “Add to Home Screen” from the browser
              menu. After the first visit, cached lessons and previously loaded SQL tools can work
              offline.
            </p>
          </div>
          <div className="settings-section about-settings">
            <span className="settings-label">
              <BookOpen size={18} />
              How learning adapts
            </span>
            <p>
              Missed or guided answers prioritize a related question. Three independently solved
              questions build concept mastery; reviews return over time. This version uses curated
              lessons and rule-based adaptation.
            </p>
            <a href="https://www.sqlite.org/lang.html" target="_blank" rel="noreferrer">
              SQLite language reference
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="reset-section">
            {reset ? (
              <>
                <p>
                  Delete all practice history on this device? Export a backup first if you want to
                  keep it.
                </p>
                <div className="settings-actions">
                  <button
                    className="button danger"
                    onClick={() => {
                      setProgress(emptyProgress());
                      setReset(false);
                      setMessage('Your progress has been reset.');
                      navigate('overview');
                    }}
                  >
                    Delete progress
                  </button>
                  <button className="button secondary" onClick={() => setReset(false)}>
                    Keep progress
                  </button>
                </div>
              </>
            ) : (
              <button className="text-button danger-text" onClick={() => setReset(true)}>
                Reset learning progress
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
function DatabaseIcon() {
  return (
    <svg width="19" height="21" viewBox="0 0 20 22" fill="none" aria-hidden="true">
      <ellipse cx="10" cy="5" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 5v12c0 1.65 3.13 3 7 3s7-1.35 7-3V5M3 11c0 1.65 3.13 3 7 3s7-1.35 7-3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
