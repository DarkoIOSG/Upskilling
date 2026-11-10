import { BarChart3, CheckCircle2, Clock3, Flame, Sparkles } from 'lucide-react';
import { topics, topicById, questionById } from '../data/curriculum';
import { dueTopics, localDay, mastery, streak, topicProgress } from '../lib/progress';
import type { Progress as ProgressData } from '../lib/types';
import { ProgressBar, SectionTitle, Status } from './ui';
import { theoryLessons, theoryLessonById, theoryQuestionById } from '../data/theory';
import { theoryDue, theoryMastery } from '../lib/theory-progress';
export default function Progress({
  progress,
  start,
  onTheory,
}: {
  progress: ProgressData;
  start: (focus?: string) => void;
  onTheory: () => void;
}) {
  const independent = progress.attempts.filter((a) => a.correct && !a.assisted).length;
  const accuracy = progress.attempts.length
    ? Math.round((independent / progress.attempts.length) * 100)
    : 0;
  const due = dueTopics(progress);
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 27 + i);
    return d;
  });
  const mastered = topics.filter((t) => mastery(progress, t.id) === 100).length;
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVIDENCE OF YOUR EFFORT</span>
          <h1>
            Look how <span>you’re growing.</span>
          </h1>
          <p>Real progress is understanding a little more than you did before.</p>
        </div>
      </div>
      <div className="stat-grid progress-stats">
        <div className="stat-card">
          <span className="stat-icon sage">
            <CheckCircle2 size={21} />
          </span>
          <div>
            <strong>
              {mastered}
              <small> / {topics.length}</small>
            </strong>
            <span>SQL concepts mastered</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon lavender">
            <BarChart3 size={21} />
          </span>
          <div>
            <strong>{accuracy}%</strong>
            <span>Independent success rate</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach">
            <Flame size={21} />
          </span>
          <div>
            <strong>
              {streak(progress)} <small>days</small>
            </strong>
            <span>Current streak</span>
          </div>
        </div>
      </div>
      <section className="theory-dashboard white-card">
        <span className="stat-icon lavender">
          <BarChart3 size={22} />
        </span>
        <div>
          <h2>Database theory progress</h2>
          <p>
            {theoryLessons.filter((l) => theoryMastery(progress, l.id) === 100).length} of{' '}
            {theoryLessons.length} lessons mastered · {theoryDue(progress).length} to revisit. Both
            tracks count toward your daily goal and activity history.
          </p>
        </div>
        <button className="button secondary" onClick={onTheory}>
          Open theory progress
        </button>
      </section>
      <div className="progress-layout">
        <section className="white-card activity-card">
          <SectionTitle title="Showing up matters" />
          <p>Your last 28 days of practice. Every attempt counts.</p>
          <div className="activity-grid">
            {days.map((d) => {
              const n = progress.attempts.filter(
                (a) => localDay(a.at) === localDay(d.getTime()),
              ).length;
              return (
                <div
                  key={d.getTime()}
                  className={`activity-cell intensity-${Math.min(3, n)}`}
                  title={`${d.toLocaleDateString()}: ${n} attempts`}
                >
                  <span>{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div className="activity-legend">
            <span>Less</span>
            {[0, 1, 2, 3].map((n) => (
              <i key={n} className={`intensity-${n}`} />
            ))}
            <span>More</span>
          </div>
        </section>
        <section className="white-card review-card">
          <span className="stat-icon sage">
            <Clock3 size={22} />
          </span>
          <h2>{due.length ? `${due.length} concepts to revisit` : 'Room for your next step'}</h2>
          <p>
            {due.length
              ? 'Spaced review helps the ideas stick. Your next session prioritizes the concepts that need attention.'
              : 'Keep practicing. Concepts return when they need a refresh, so understanding lasts.'}
          </p>
          <button className="button primary" onClick={() => start(due[0])}>
            {due.length ? 'Start a review' : 'Start practicing'}
          </button>
        </section>
      </div>
      <SectionTitle eyebrow="KNOW WHAT YOU KNOW" title="Your concept map" />
      <div className="concept-map">
        {topics.map((t) => {
          const p = topicProgress(progress, t.id);
          return (
            <button className="concept-map-row" key={t.id} onClick={() => start(t.id)}>
              <div>
                <strong>{t.title}</strong>
                <span>
                  {t.level}
                  {p.needsReview ? ' · Review recommended' : ''}
                </span>
              </div>
              <ProgressBar value={mastery(progress, t.id)} />
              <Status value={mastery(progress, t.id)} />
            </button>
          );
        })}
      </div>
      <SectionTitle title="Recent practice" />
      {progress.attempts.length ? (
        <div className="history-list">
          {[...progress.attempts]
            .reverse()
            .slice(0, 12)
            .map((a, i) => (
              <div className="history-row" key={`${a.at}-${i}`}>
                <span className={`history-dot ${a.correct && !a.assisted ? 'success' : ''}`}>
                  {a.correct && !a.assisted ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
                </span>
                <div>
                  <strong>
                    {questionById[a.questionId]?.title ?? theoryQuestionById[a.questionId]?.prompt}
                  </strong>
                  <span>
                    {topicById[a.topicId]?.title ?? theoryLessonById[a.topicId]?.title} ·{' '}
                    {a.correct
                      ? a.assisted
                        ? 'Guided success'
                        : 'Independent success'
                      : 'Learning opportunity'}
                  </span>
                </div>
                <time>
                  {new Date(a.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </time>
              </div>
            ))}
        </div>
      ) : (
        <div className="empty-state compact">
          <BarChart3 size={28} />
          <h3>Your story starts with one question.</h3>
          <p>Complete a practice question to see your progress here.</p>
        </div>
      )}
      <p className="metric-note">
        Mastery means solving all three questions in a concept without help. This is a practice
        signal, not a guarantee of interview readiness.
      </p>
    </div>
  );
}
