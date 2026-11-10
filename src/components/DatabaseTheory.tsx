import { useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  Search,
} from 'lucide-react';
import { theoryLessons, theoryLessonById, theoryModules, theoryQuestions } from '../data/theory';
import { theoryBooks, theoryReadings, theoryReadingById } from '../data/theory-sources';
import { nextTheoryQuestion, theoryDue, theoryMastery } from '../lib/theory-progress';
import { topicProgress } from '../lib/progress';
import type { Attempt, Progress } from '../lib/types';
import type { TheoryLesson } from '../lib/theory-types';
import { ProgressBar } from './ui';

function ReadingLinks({ lesson }: { lesson: TheoryLesson }) {
  return (
    <div className="theory-readings">
      <strong>Read the source</strong>
      {lesson.readings.map((id) => {
        const reading = theoryReadingById[id];
        return (
          <a key={id} href={reading.url} target="_blank" rel="noreferrer">
            {reading.book === 'design' ? 'Database Design' : 'Database Architecture'} ·{' '}
            {reading.label}
            <ArrowUpRight size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        );
      })}
    </div>
  );
}

function Explain({
  lesson,
  onHelp,
  initial = '',
}: {
  lesson: TheoryLesson;
  onHelp?: () => void;
  initial?: string;
}) {
  const [mode, setMode] = useState(initial);
  return (
    <div className="theory-explain">
      <h3>
        <Lightbulb size={18} /> Let’s make it click
      </h3>
      <div className="theory-explain-buttons" role="group" aria-label="Choose an explanation">
        {[
          ['simple', 'Explain more simply'],
          ['example', 'Show a worked example'],
          ['steps', 'Break it down'],
        ].map(([id, label]) => (
          <button
            key={id}
            className="small-button"
            aria-pressed={mode === id}
            onClick={() => {
              setMode(id);
              onHelp?.();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {mode && (
        <div className="theory-explanation" role="status">
          <strong>
            {mode === 'simple'
              ? 'In simpler words'
              : mode === 'example'
                ? 'A worked example'
                : 'Step by step'}
          </strong>
          {mode === 'steps' ? (
            <ol>
              {lesson.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          ) : (
            <p>{mode === 'simple' ? lesson.simple : lesson.example}</p>
          )}
        </div>
      )}
    </div>
  );
}

function TheoryReader({
  lesson,
  onBack,
  onStart,
  onRead,
}: {
  lesson: TheoryLesson;
  onBack: () => void;
  onStart: (id: string) => void;
  onRead: (id: string) => void;
}) {
  const index = theoryLessons.findIndex((l) => l.id === lesson.id);
  return (
    <div className="theory-reader" key={lesson.id}>
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={15} /> All theory lessons
      </button>
      <article className="white-card theory-lesson">
        <span className="eyebrow">
          LESSON {index + 1} OF {theoryLessons.length} · {lesson.module}
        </span>
        <h2>{lesson.title}</h2>
        <div className="theory-objectives">
          {lesson.objectives.map((o) => (
            <span key={o}>{o}</span>
          ))}
        </div>
        <div className="theory-body">
          {lesson.body.split('\n\n').map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <Explain key={lesson.id} lesson={lesson} />
        <div className="lesson-pitfall">
          <strong>Common mistake</strong>
          <p>{lesson.pitfall}</p>
        </div>
        <div className="theory-recall">
          <strong>Pause and explain it back</strong>
          <p>
            In your own words: {lesson.objectives.join(', ')}. Say what the idea means, give an
            example, and name a case where it matters. Then close the notes and try the questions.
          </p>
        </div>
        <ReadingLinks lesson={lesson} />
        <button className="button primary" onClick={() => onStart(lesson.id)}>
          Practice this lesson <ArrowRight size={16} />
        </button>
      </article>
      <div className="theory-reader-nav">
        <button
          className="button secondary"
          disabled={index === 0}
          onClick={() => onRead(theoryLessons[index - 1].id)}
        >
          <ArrowLeft size={15} /> Previous lesson
        </button>
        <button
          className="button secondary"
          disabled={index === theoryLessons.length - 1}
          onClick={() => onRead(theoryLessons[index + 1].id)}
        >
          Next lesson <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function TheoryPractice({
  progress,
  focus,
  onRecord,
  onExit,
  onRead,
  onRestart,
}: {
  progress: Progress;
  focus?: string;
  onRecord: (a: Attempt) => void;
  onExit: () => void;
  onRead: (id: string) => void;
  onRestart: () => void;
}) {
  const id = useId();
  const [question, setQuestion] = useState(() => nextTheoryQuestion(progress, [], focus));
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; assisted: boolean } | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState('');
  const checkLock = useRef(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const limit = focus ? theoryLessonById[focus].checks.length : 5;
  const lesson = theoryLessonById[question.lessonId];
  const retry = () => {
    setSelected(null);
    setFeedback(null);
    setAssisted(true);
    setShowHelp(false);
    checkLock.current = false;
    setNotice(
      'This retry is guided practice because you have seen the answer. A different question checks independent understanding.',
    );
  };
  const check = () => {
    if (selected === null || feedback || checkLock.current) return;
    checkLock.current = true;
    const correct = selected === question.answer;
    const attempt: Attempt = {
      questionId: question.id,
      topicId: lesson.id,
      correct,
      assisted,
      at: Date.now(),
    };
    onRecord(attempt);
    setAttempts((a) => [...a, attempt]);
    setSeen((s) => [...new Set([...s, question.id])]);
    setFeedback({ correct, assisted });
  };
  const advance = () => {
    if (seen.length >= limit) {
      setFinished(true);
      return;
    }
    setQuestion(nextTheoryQuestion(progress, seen, focus));
    setSelected(null);
    setFeedback(null);
    setAssisted(false);
    setShowHelp(false);
    setNotice('');
    checkLock.current = false;
    requestAnimationFrame(() => questionHeading.current?.focus());
  };
  if (finished) {
    const independent = new Set(
      attempts.filter((a) => a.correct && !a.assisted).map((a) => a.questionId),
    ).size;
    const revisit = [
      ...new Set(attempts.filter((a) => !a.correct || a.assisted).map((a) => a.topicId)),
    ];
    return (
      <section className="white-card theory-complete">
        <CheckCircle2 size={36} />
        <span className="eyebrow">THEORY SESSION COMPLETE</span>
        <h2>A little more understanding.</h2>
        <p>
          {independent} of {seen.length} questions answered independently. Guided answers are useful
          practice; they do not add mastery evidence.
        </p>
        {revisit.length > 0 && (
          <div className="theory-revisit">
            <strong>Give these ideas another look</strong>
            {revisit.map((lessonId) => (
              <button className="text-button" key={lessonId} onClick={() => onRead(lessonId)}>
                {theoryLessonById[lessonId].title}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        )}
        <p>
          Missed or guided concepts return first. Independent successes grow the review interval
          from 1 day, doubling up to 30 days. Reading alone does not mark a lesson mastered.
        </p>
        <div className="theory-session-actions">
          <button className="button primary" onClick={onRestart}>
            Practice again <RotateCcw size={15} />
          </button>
          <button className="button secondary" onClick={onExit}>
            Back to theory lessons
          </button>
        </div>
      </section>
    );
  }
  return (
    <div className="theory-practice">
      <div className="theory-session-bar">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={15} /> End session
        </button>
        <span>
          {focus ? 'Lesson practice' : 'Adaptive theory review'} · Question{' '}
          {Math.min(seen.filter((q) => q !== question.id).length + 1, limit)} of {limit}
        </span>
      </div>
      <ProgressBar value={(seen.length / limit) * 100} />
      <section className="white-card theory-question" aria-labelledby={`${id}-heading`}>
        <span className="eyebrow">
          {lesson.module} · {lesson.title}
        </span>
        <h2 id={`${id}-heading`} tabIndex={-1} ref={questionHeading}>
          {question.prompt}
        </h2>
        <fieldset
          disabled={feedback !== null}
          aria-describedby={feedback ? `${id}-feedback` : undefined}
        >
          <legend className="sr-only">Choose one answer</legend>
          <div className="check-options">
            {question.options.map((option, i) => (
              <label
                key={`${question.id}-${i}`}
                className={`check-option ${selected === i ? 'chosen' : ''} ${feedback && i === question.answer ? 'theory-correct-option' : ''}`}
              >
                <input
                  type="radio"
                  name={`${id}-${question.id}`}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {notice && (
          <p className="metric-note" role="status">
            {notice}
          </p>
        )}
        {!feedback ? (
          <>
            <div className="theory-session-actions">
              <button className="button primary" disabled={selected === null} onClick={check}>
                Check theory answer
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setShowHelp((h) => !h);
                  setAssisted(true);
                }}
              >
                <Lightbulb size={16} /> Explain this concept
              </button>
            </div>
            {assisted && (
              <p className="metric-note">Help opened · This question counts as guided practice.</p>
            )}
            {showHelp && (
              <Explain
                key={question.id}
                lesson={lesson}
                initial="simple"
                onHelp={() => setAssisted(true)}
              />
            )}
          </>
        ) : (
          <>
            <div
              id={`${id}-feedback`}
              className={`check-feedback ${feedback.correct ? 'is-correct' : ''}`}
              role="status"
            >
              <h3>
                {feedback.correct
                  ? feedback.assisted
                    ? 'Good practice. Try another independently.'
                    : 'You understood the distinction.'
                  : 'Let’s work through the idea.'}
              </h3>
              {!feedback.correct && (
                <p>
                  <strong>Correct answer:</strong> {question.options[question.answer]}
                </p>
              )}
              <p>{question.explanation}</p>
              <p>
                {feedback.correct && !feedback.assisted
                  ? 'Independent answer saved.'
                  : 'This concept stays in your review queue.'}
              </p>
            </div>
            <Explain
              key={`${question.id}-feedback`}
              lesson={lesson}
              initial={feedback.correct ? '' : 'simple'}
            />
            <div className="theory-session-actions">
              <button className="button primary" onClick={advance}>
                {seen.length >= limit ? 'Finish theory session' : 'Next theory question'}
                <ArrowRight size={15} />
              </button>
              {!feedback.correct && (
                <button className="button secondary" onClick={retry}>
                  <RotateCcw size={15} /> Try this question again
                </button>
              )}
              <button className="text-button" onClick={() => onRead(lesson.id)}>
                Read full lesson <BookOpen size={15} />
              </button>
            </div>
          </>
        )}
      </section>
      <p className="metric-note">
        Three distinct, independently answered questions build lesson mastery. Explanations and
        retries are guided practice. Reviews test retention; this is a practice signal.
      </p>
    </div>
  );
}

function SourceLibrary({ onRead }: { onRead: (id: string) => void }) {
  return (
    <div className="theory-library">
      <div className="theory-coverage-note">
        <BookOpen size={22} />
        <div>
          <h2>Your free reading library</h2>
          <p>
            Every chapter and appendix in Database Design and every major section in Architecture
            has a lesson mapping below. These are study-guide introductions and original checks; the
            books provide the full treatment, detailed examples, and additional exercises. Neither
            is an industry certification standard.
          </p>
        </div>
      </div>
      {theoryBooks.map((book) => (
        <section className="white-card theory-book" key={book.id}>
          <span className="eyebrow">FREE AUTHOR / PUBLISHER SOURCE</span>
          <h2>{book.title}</h2>
          <p>{book.authors}</p>
          <p>{book.description}</p>
          <a
            className="button secondary theory-book-link"
            href={book.url}
            target="_blank"
            rel="noreferrer"
          >
            Read the free {book.id === 'design' ? 'textbook' : 'monograph'}
            <ArrowUpRight size={15} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <details open>
            <summary>
              Chapter and section coverage ·{' '}
              {theoryReadings.filter((r) => r.book === book.id).length} mapped units
            </summary>
            <div className="theory-coverage">
              {theoryReadings
                .filter((r) => r.book === book.id)
                .map((r) => (
                  <div className="theory-coverage-row" key={r.id}>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.label}
                      <ArrowUpRight size={12} />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <div>
                      {theoryLessons
                        .filter((l) => l.readings.includes(r.id))
                        .map((l) => (
                          <button className="text-button" key={l.id} onClick={() => onRead(l.id)}>
                            {l.title}
                            <ArrowRight size={12} />
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </details>
          <p className="metric-note">
            {book.license}{' '}
            <a href={book.licenseUrl} target="_blank" rel="noreferrer">
              {book.id === 'design' ? 'License details' : 'MIT reading assignment'}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </section>
      ))}
      <div className="white-card theory-book">
        <h2>Current implementation references</h2>
        <p>
          Engine behavior can differ from the general theory. These official PostgreSQL references
          supplement the historical systems text.
        </p>
        <a
          href="https://www.postgresql.org/docs/current/transaction-iso.html"
          target="_blank"
          rel="noreferrer"
        >
          Transaction isolation ↗
        </a>
        {' · '}
        <a
          href="https://www.postgresql.org/docs/current/wal-intro.html"
          target="_blank"
          rel="noreferrer"
        >
          Write-ahead logging ↗
        </a>
        {' · '}
        <a
          href="https://www.postgresql.org/docs/current/different-replication-solutions.html"
          target="_blank"
          rel="noreferrer"
        >
          Replication choices ↗
        </a>
      </div>
    </div>
  );
}

export default function DatabaseTheory({
  progress,
  onRecord,
  onSql,
}: {
  progress: Progress;
  onRecord: (a: Attempt) => void;
  onSql: () => void;
}) {
  const [mode, setMode] = useState<'lessons' | 'practice' | 'books'>('lessons');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [filter, setFilter] = useState('All modules');
  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState<string>();
  const [session, setSession] = useState(0);
  const viewHeading = useRef<HTMLHeadingElement>(null);
  const due = theoryDue(progress);
  const mastered = theoryLessons.filter((l) => theoryMastery(progress, l.id) === 100).length;
  const scroll = () =>
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      viewHeading.current?.focus();
    });
  const read = (id: string) => {
    setLessonId(id);
    setMode('lessons');
    scroll();
  };
  const start = (id?: string) => {
    setFocus(id);
    setSession((s) => s + 1);
    setMode('practice');
    setLessonId(null);
    scroll();
  };
  const back = () => {
    setMode('lessons');
    setLessonId(null);
    scroll();
  };
  const filtered = theoryLessons.filter(
    (l) =>
      (filter === 'All modules' || l.module === filter) &&
      `${l.title} ${l.objectives.join(' ')} ${l.body}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-enter theory-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UNDERSTAND THE SYSTEM BEHIND THE SQL</span>
          <h1 ref={viewHeading} tabIndex={-1}>
            Database <span>theory.</span>
          </h1>
          <p>
            {theoryLessons.length} lessons · {theoryQuestions.length} questions · Read, explain it
            back, and revisit what needs practice.
          </p>
        </div>
        <span className="track-pill">
          <GraduationCap size={18} /> Theory track
        </span>
      </div>
      <div className="theory-mode-tabs" role="group" aria-label="Theory sections">
        <button aria-pressed={mode === 'lessons'} onClick={back}>
          <BookOpen size={16} /> Lessons
        </button>
        <button aria-pressed={mode === 'practice'} onClick={() => start()}>
          <RotateCcw size={16} /> Review{due.length ? ` (${due.length})` : ''}
        </button>
        <button
          aria-pressed={mode === 'books'}
          onClick={() => {
            setMode('books');
            setLessonId(null);
          }}
        >
          <ArrowUpRight size={16} /> Books & coverage
        </button>
      </div>
      {mode === 'practice' ? (
        <TheoryPractice
          key={session}
          progress={progress}
          focus={focus}
          onRecord={onRecord}
          onExit={back}
          onRead={read}
          onRestart={() => start(focus)}
        />
      ) : mode === 'books' ? (
        <SourceLibrary onRead={read} />
      ) : lessonId ? (
        <TheoryReader
          key={lessonId}
          lesson={theoryLessonById[lessonId]}
          onBack={back}
          onStart={start}
          onRead={read}
        />
      ) : (
        <>
          <section className="theory-start white-card">
            <div>
              <span className="eyebrow">SMALL STEPS, STRONG FOUNDATIONS</span>
              <h2>
                {due.length
                  ? `${due.length} lessons ready to revisit`
                  : 'Understand why, not only how.'}
              </h2>
              <p>
                {mastered} of {theoryLessons.length} lessons mastered · Missed answers get another
                explanation and return in review. Independent answers extend your review interval.
              </p>
            </div>
            <button className="button primary" onClick={() => start()}>
              {due.length ? 'Review theory' : 'Start theory practice'}
              <ArrowRight size={16} />
            </button>
          </section>
          <div className="path-toolbar theory-toolbar">
            <label className="search-input">
              <Search size={17} />
              <input
                aria-label="Search theory lessons"
                placeholder="Find keys, normalization, recovery…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="theory-module-filter">
              Module
              <select
                aria-label="Filter theory module"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {['All modules', ...theoryModules].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          {theoryModules.map((module) => {
            const rows = filtered.filter((l) => l.module === module);
            return (
              rows.length > 0 && (
                <section className="path-section" key={module}>
                  <div className="path-level-heading">
                    <span className="level-number">0{theoryModules.indexOf(module) + 1}</span>
                    <div>
                      <h2>{module}</h2>
                      <p>{rows.length} lessons · Original questions with explanations</p>
                    </div>
                  </div>
                  <div className="topic-grid">
                    {rows.map((l) => {
                      const p = topicProgress(progress, l.id),
                        m = theoryMastery(progress, l.id);
                      const isDue = due.includes(l.id);
                      return (
                        <article className="topic-card theory-topic" key={l.id}>
                          <div className="topic-card-top">
                            <span className="topic-symbol">
                              <BookOpen size={21} />
                            </span>
                            <span
                              className={`status ${isDue ? 'practicing' : m === 100 ? 'mastered' : m > 0 ? 'practicing' : 'new'}`}
                            >
                              {isDue
                                ? 'Review recommended'
                                : m === 100
                                  ? 'Mastered'
                                  : m > 0
                                    ? 'In progress'
                                    : 'Not started'}
                            </span>
                          </div>
                          <h3>{l.title}</h3>
                          <p>{l.objectives.join(' · ')}</p>
                          <div className="topic-mastery">
                            <span>
                              {p.masteredQuestions.length} of {l.checks.length} independently
                              answered
                            </span>
                            <strong>{m}%</strong>
                          </div>
                          <ProgressBar value={m} />
                          {p.dueAt > 0 && !isDue && (
                            <p className="theory-next-review">
                              <Clock3 size={12} /> Review{' '}
                              {new Date(p.dueAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          )}
                          <div className="topic-actions">
                            <button className="text-button" onClick={() => read(l.id)}>
                              <BookOpen size={15} /> Read lesson
                            </button>
                            <button className="small-button" onClick={() => start(l.id)}>
                              Practice questions
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
              <h2>No theory lessons found</h2>
              <p>Try a different search or module.</p>
              <button
                className="button secondary"
                onClick={() => {
                  setSearch('');
                  setFilter('All modules');
                }}
              >
                Clear theory filters
              </button>
            </div>
          )}
          <div className="theory-coverage-note">
            <GraduationCap size={24} />
            <div>
              <h2>Connect the ideas to real SQL</h2>
              <p>
                The theory track builds concepts. Use the SQL track to practise executable queries,
                inspect results, and test edge cases.
              </p>
              <button className="text-button" onClick={onSql}>
                Open SQL learning path
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
