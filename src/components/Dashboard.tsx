import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Flame,
  Layers3,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { levels, questions, topics, topicById } from '../data/curriculum';
import { dueTopics, localDay, mastery, nextQuestion, streak, todayAttempts } from '../lib/progress';
import type { Progress } from '../lib/types';
import { ProgressBar, SectionTitle } from './ui';
export default function Dashboard({
  progress,
  start,
  navigate,
}: {
  progress: Progress;
  start: (focus?: string) => void;
  navigate: (page: string) => void;
}) {
  const next = nextQuestion(progress),
    current = topicById[next.topic];
  const mastered = topics.filter((t) => mastery(progress, t.id) === 100).length;
  const solved = new Set(
    progress.attempts.filter((a) => a.correct && !a.assisted).map((a) => a.questionId),
  ).size;
  const today = new Set(todayAttempts(progress).map((a) => a.questionId)).size;
  const due = dueTopics(progress);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });
  const active = new Set(progress.attempts.map((a) => localDay(a.at)));
  const stage =
    levels.find((l) =>
      topics.filter((t) => t.level === l).some((t) => mastery(progress, t.id) < 100),
    ) ?? 'Interview';
  return (
    <div className="dashboard page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow greeting">YOUR LEARNING WORKSPACE</div>
          <h1>
            A little better, <span>every day.</span>
          </h1>
          <p>Big goals. Small steps. Let’s build your SQL confidence.</p>
        </div>
        <span className="date-chip">
          {new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
          <span />A good day to learn
        </span>
      </div>
      <div className="dashboard-grid">
        <div className="main-column">
          <section className="session-card">
            <div className="session-copy">
              <div className="session-kicker">
                <span className="live-dot" /> YOUR NEXT STEP
              </div>
              <h2>
                {progress.attempts.length ? 'Keep the momentum.' : 'Start with a little curiosity.'}
                <br />
                <span>{due.length ? 'Make it click.' : 'Let’s write some SQL.'}</span>
              </h2>
              <p>
                {due.length
                  ? 'A few concepts could use another look. Your next session will help turn those gaps into understanding.'
                  : 'A few good questions today. A deeper understanding tomorrow. Your practice adapts as you learn.'}
              </p>
              <div className="session-meta">
                <span>
                  <Clock3 size={14} />
                  10–15 min
                </span>
                <span>
                  <Layers3 size={14} />5 questions
                </span>
                <span>
                  <Sparkles size={14} />
                  Adapts to you
                </span>
              </div>
              <button className="button light" onClick={() => start()}>
                {progress.attempts.length ? 'Continue learning' : 'Start your first session'}
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="code-tile tile-back">
                <span>01</span>
                <span>02</span>
                <span>03</span>
              </div>
              <div className="code-tile tile-front">
                <div className="tile-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <code>
                  <em>SELECT</em> knowledge
                  <br />
                  <em>FROM</em> practice
                  <br />
                  <em>WHERE</em> curiosity = <b>true</b>;
                </code>
                <div className="tile-result">
                  <Check size={13} /> Growth, one query at a time.
                </div>
              </div>
              <div className="floating-spark">✳</div>
            </div>
          </section>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-icon peach">
                <Flame size={20} />
              </span>
              <div>
                <strong>
                  {streak(progress)} <small>days</small>
                </strong>
                <span>Current streak</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon sage">
                <Code2 size={20} />
              </span>
              <div>
                <strong>
                  {solved}
                  <small> / {questions.length}</small>
                </strong>
                <span>Questions solved independently</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon lavender">
                <Target size={20} />
              </span>
              <div>
                <strong>
                  {mastered}
                  <small> / {topics.length}</small>
                </strong>
                <span>Concepts mastered</span>
              </div>
            </div>
          </div>
          <SectionTitle
            eyebrow="THE BIG PICTURE"
            title="Your SQL journey"
            action="Explore learning path"
            onClick={() => navigate('path')}
          />
          <div className="journey-card">
            {levels.map((level, i) => {
              const ts = topics.filter((t) => t.level === level);
              const completed = ts.filter((t) => mastery(progress, t.id) === 100).length;
              return (
                <button
                  key={level}
                  onClick={() => navigate('path')}
                  className={`journey-step ${stage === level ? 'current' : ''}`}
                >
                  <span className="step-line" />
                  <span className="step-number">
                    {completed === ts.length ? <Check size={16} /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="step-name">{level}</span>
                  <span className="step-description">
                    {
                      [
                        'Build a solid base',
                        'Connect the pieces',
                        'Go a level deeper',
                        'Think it through',
                      ][i]
                    }
                  </span>
                  <span className="step-progress">
                    {completed} / {ts.length} concepts
                  </span>
                  <ProgressBar value={(completed / ts.length) * 100} />
                  {stage === level && <span className="here-label">YOU ARE HERE</span>}
                </button>
              );
            })}
          </div>
          <SectionTitle
            eyebrow="ONE CONCEPT AT A TIME"
            title={due.length ? 'Worth another look' : 'Up next for you'}
            action="All concepts"
            onClick={() => navigate('path')}
          />
          <div className="next-concepts">
            {(due.length
              ? due.slice(0, 2).map((id) => topicById[id])
              : [
                  current,
                  topics[(topics.findIndex((t) => t.id === current.id) + 1) % topics.length],
                ]
            ).map((t, i) => (
              <button key={t.id} className="concept-preview" onClick={() => start(t.id)}>
                <div className={`concept-icon ${i ? 'peach' : 'sage'}`}>
                  {i ? <Layers3 size={22} /> : <Code2 size={22} />}
                </div>
                <span className="concept-preview-copy">
                  <span className="eyebrow">{t.level}</span>
                  <strong>{t.title}</strong>
                  <span>{t.description}</span>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          <div className="gentle-note">
            <Sparkles size={16} />
            <span>Getting it wrong is part of getting it. We’ll help you understand the why.</span>
          </div>
        </div>
        <aside className="right-column">
          <section className="daily-card">
            <div className="card-heading">
              <h3>Your daily rhythm</h3>
              <span className="mini-icon">
                <TrendingUp size={17} />
              </span>
            </div>
            <div className="goal-display">
              <span>
                <strong>{today}</strong>
                <span> / {progress.dailyGoal}</span>
              </span>
              <span className="tiny-label">questions today</span>
            </div>
            <ProgressBar value={(today / progress.dailyGoal) * 100} />
            <p>
              {today >= progress.dailyGoal
                ? 'Daily goal reached. A good day’s progress.'
                : 'A little practice goes a long way.'}
            </p>
            <div className="week-row">
              {dates.map((date, i) => (
                <div
                  className={`day ${active.has(localDay(date.getTime())) ? 'active' : ''} ${i === 6 ? 'today' : ''}`}
                  key={i}
                >
                  <span>{date.toLocaleDateString('en', { weekday: 'narrow' })}</span>
                  <span className="day-circle">
                    {active.has(localDay(date.getTime())) ? (
                      <Check size={13} />
                    ) : i === 6 ? (
                      <span className="today-dot" />
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="focus-card">
            <div className="card-heading">
              <h3>Currently exploring</h3>
              <BookOpen size={17} />
            </div>
            <div className="focus-visual">
              <div className="database-stack">
                <i />
                <i />
                <i />
              </div>
              <span>SQL</span>
            </div>
            <div className="focus-details">
              <span className="eyebrow">YOUR FIRST LEARNING TRACK</span>
              <h3>Structured Query Language</h3>
              <p>From your first SELECT to your next technical interview.</p>
            </div>
            <div className="focus-progress">
              <span>Overall mastery</span>
              <strong>
                {Math.round(
                  topics.reduce((n, t) => n + mastery(progress, t.id), 0) / topics.length,
                )}
                %
              </strong>
            </div>
            <ProgressBar
              value={topics.reduce((n, t) => n + mastery(progress, t.id), 0) / topics.length}
            />
            <button className="text-button" onClick={() => navigate('path')}>
              View track
              <ArrowUpRight size={15} />
            </button>
          </section>
          <section className="insight-card">
            <span className="insight-symbol">“</span>
            <p>
              Don’t just learn the answer.
              <br />
              <strong>Understand the question.</strong>
            </p>
            <span>That’s where real growth starts.</span>
          </section>
          <button className="review-link" onClick={() => start(due[0])}>
            <span className="review-icon">
              <Play size={15} />
            </span>
            <span>
              <strong>
                {due.length
                  ? `${due.length} concepts ready for review`
                  : 'Your pace. Your progress.'}
              </strong>
              <small>
                {due.length ? 'Strengthen what you’ve learned' : 'No timers. No pressure.'}
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
        </aside>
      </div>
    </div>
  );
}
