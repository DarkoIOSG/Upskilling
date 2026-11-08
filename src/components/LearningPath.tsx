import { useState } from 'react';
import { ArrowRight, BookOpen, Code2, Search } from 'lucide-react';
import { levels, topics, questions } from '../data/curriculum';
import { mastery, topicProgress } from '../lib/progress';
import type { Progress, Topic } from '../lib/types';
import { Modal, ProgressBar, Status } from './ui';
import Lesson from './Lesson';
export default function LearningPath({
  progress,
  start,
}: {
  progress: Progress;
  start: (focus?: string) => void;
}) {
  const [filter, setFilter] = useState('All levels');
  const [search, setSearch] = useState('');
  const [lesson, setLesson] = useState<Topic | null>(null);
  const filtered = topics.filter(
    (t) =>
      (filter === 'All levels' || t.level === filter) &&
      `${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ROADMAP TO CONFIDENCE</span>
          <h1>
            One concept <span>at a time.</span>
          </h1>
          <p>
            Short lessons, practical tips, and quick checks. Build understanding, then put it into
            practice.
          </p>
        </div>
        <div className="track-pill">
          <Code2 size={18} /> SQL track · {questions.length} questions
        </div>
      </div>
      <div className="path-toolbar">
        <div className="filter-tabs" aria-label="Filter by difficulty">
          {['All levels', ...levels].map((l) => (
            <button key={l} className={filter === l ? 'selected' : ''} onClick={() => setFilter(l)}>
              {l}
            </button>
          ))}
        </div>
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Search concepts"
            placeholder="Find a concept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {levels
        .filter((l) => filter === 'All levels' || filter === l)
        .map((level) => {
          const rows = filtered.filter((t) => t.level === level);
          return (
            rows.length > 0 && (
              <section key={level} className="path-section">
                <div className="path-level-heading">
                  <span className="level-number">0{levels.indexOf(level) + 1}</span>
                  <div>
                    <h2>{level}</h2>
                    <p>
                      {
                        [
                          'The building blocks of every great query.',
                          'Connect tables, ideas, and possibilities.',
                          'Solve richer problems with precise SQL.',
                          'Reason about correctness, performance, and tradeoffs.',
                        ][levels.indexOf(level)]
                      }
                    </p>
                  </div>
                  <span className="path-level-count">
                    {
                      topics.filter((t) => t.level === level && mastery(progress, t.id) === 100)
                        .length
                    }{' '}
                    / 4 mastered
                  </span>
                </div>
                <div className="topic-grid">
                  {rows.map((t) => {
                    const m = mastery(progress, t.id),
                      p = topicProgress(progress, t.id);
                    return (
                      <article className="topic-card" key={t.id}>
                        <div className="topic-card-top">
                          <span className="topic-symbol">
                            <Code2 size={21} />
                          </span>
                          <Status value={m} />
                        </div>
                        <h3>{t.title}</h3>
                        <p>{t.description}</p>
                        <div className="topic-mastery">
                          <span>
                            {p.needsReview
                              ? 'Practice recommended'
                              : `${p.masteredQuestions.length} of 3 independently solved`}
                          </span>
                          <strong>{m}%</strong>
                        </div>
                        <ProgressBar value={m} />
                        <div className="topic-actions">
                          <button className="text-button" onClick={() => setLesson(t)}>
                            <BookOpen size={15} />
                            Short lesson
                          </button>
                          <button className="small-button" onClick={() => start(t.id)}>
                            Practice
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )
          );
        })}
      {!filtered.length && (
        <div className="empty-state">
          <Search size={28} />
          <h2>No concepts found</h2>
          <p>Try searching for joins, ranking, or transactions.</p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch('');
              setFilter('All levels');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {lesson && (
        <Modal title={lesson.title} onClose={() => setLesson(null)}>
          <Lesson topic={lesson} />
          <button className="button primary full" onClick={() => start(lesson.id)}>
            Put it into practice
            <ArrowRight size={16} />
          </button>
        </Modal>
      )}
    </div>
  );
}
