import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  Database,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { questions, topicById } from '../data/curriculum';
import { schema } from '../data/database';
import { nextQuestion } from '../lib/progress';
import { runSql } from '../lib/runner';
import type { Attempt, Evaluation, Progress, QueryResult } from '../lib/types';
import { DataTable, ProgressBar } from './ui';
import Lesson from './Lesson';
interface Props {
  progress: Progress;
  focus?: string;
  onRecord: (a: Attempt) => void;
  onExit: () => void;
  onRestart: () => void;
}
export default function Study({ progress, focus, onRecord, onExit, onRestart }: Props) {
  const [question, setQuestion] = useState(() => nextQuestion(progress, [], focus));
  const [sql, setSql] = useState(question.type === 'sql' ? question.starter : '');
  const [answer, setAnswer] = useState<number | null>(null);
  const [hint, setHint] = useState(false),
    [notes, setNotes] = useState(false),
    [solution, setSolution] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [runResult, setRunResult] = useState<Evaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState<
    { id: string; correct: boolean; independent: boolean }[]
  >([]);
  const [finished, setFinished] = useState(false);
  const [dataTab, setDataTab] = useState<'schema' | 'rows'>('schema');
  const [table, setTable] = useState('employees');
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [resultTab, setResultTab] = useState<'yours' | 'expected'>('yours');
  const goal = focus ? questions.filter((q) => q.topic === focus).length : 5;
  const currentTopic = topicById[question.topic];
  const sqlRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let active = true;
    setTableData(null);
    runSql(`SELECT * FROM ${table}`).then((r) => {
      if (active && r.actual) setTableData(r.actual);
    });
    return () => {
      active = false;
    };
  }, [table]);
  const submit = async (graded: boolean) => {
    if (busy || (graded && evaluation?.correct)) return;
    setBusy(true);
    const value: Evaluation =
      question.type === 'sql'
        ? await runSql(sql, graded ? question.id : undefined)
        : { correct: answer === question.answer };
    if (graded) {
      setEvaluation(value);
      setRunResult(null);
      setResultTab('yours');
      onRecord({
        questionId: question.id,
        topicId: question.topic,
        correct: value.correct,
        assisted,
        at: Date.now(),
      });
      if (!value.correct) {
        setAssisted(true);
        setNotes(true);
      }
    } else setRunResult(value);
    setBusy(false);
  };
  const next = () => {
    const done = [
      ...completed,
      {
        id: question.id,
        correct: !!evaluation?.correct,
        independent: !!evaluation?.correct && !assisted,
      },
    ];
    setCompleted(done);
    if (done.length >= goal) {
      setFinished(true);
      return;
    }
    const q = nextQuestion(
      progress,
      done.map((x) => x.id),
      focus,
    );
    setQuestion(q);
    setSql(q.type === 'sql' ? q.starter : '');
    setAnswer(null);
    setHint(false);
    setNotes(false);
    setSolution(false);
    setAssisted(false);
    setEvaluation(null);
    setRunResult(null);
    setResultTab('yours');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (finished) {
    const independent = completed.filter((x) => x.independent).length;
    const review = completed.filter((x) => !x.independent).length;
    return (
      <div className="session-complete page-enter">
        <span className="complete-icon">
          <CheckCircle2 size={38} />
        </span>
        <span className="eyebrow">ANOTHER STEP FORWARD</span>
        <h1>That’s progress.</h1>
        <p>You made time to learn. Every question helps you understand what comes next.</p>
        <div className="complete-stats">
          <div>
            <strong>{completed.length}</strong>
            <span>Questions practiced</span>
          </div>
          <div>
            <strong>{independent}</strong>
            <span>Solved independently</span>
          </div>
          <div>
            <strong>{review}</strong>
            <span>Ready for another look</span>
          </div>
        </div>
        <div className="session-note">
          <Sparkles size={20} />
          <p>
            {review
              ? 'The concepts you found tricky will come back in your next session, with related questions to help them click.'
              : 'Great work. Your next session will build on this and make room for spaced review.'}
          </p>
        </div>
        <button className="button primary" onClick={onRestart}>
          Keep learning
          <ArrowRight size={17} />
        </button>
        <button className="text-button" onClick={onExit}>
          Back to overview
        </button>
      </div>
    );
  }
  const result = runResult ?? evaluation;
  return (
    <div className="study page-enter">
      <div className="study-topbar">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={17} />
          Leave session
        </button>
        <span className="session-counter">
          Question <strong>{completed.length + 1}</strong> of {goal}
        </span>
        <span className="adaptive-badge">
          <Sparkles size={14} />
          Adaptive practice
        </span>
      </div>
      <ProgressBar value={(completed.length / goal) * 100} />
      <div className="study-layout">
        <div className="exercise-column">
          <div className="exercise-heading">
            <span className="eyebrow">
              {currentTopic.level} <ChevronRight size={12} /> {currentTopic.title}
            </span>
            <span className="exercise-type">
              {question.type === 'sql' ? <Code2 size={13} /> : <CircleHelp size={13} />}{' '}
              {question.type === 'sql' ? 'Write a query' : 'Think it through'}
            </span>
            <h1>{question.title}</h1>
            <p>{question.prompt}</p>
          </div>
          {question.type === 'sql' ? (
            <div className="editor-card">
              <div className="editor-toolbar">
                <span>
                  <span className="editor-dot" /> query.sql
                </span>
                <span>
                  SQLite <span className="editor-divider">|</span> Local sandbox
                </span>
              </div>
              <div className="editor-body">
                <div className="line-numbers" aria-hidden="true">
                  {sql.split('\n').map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
                <textarea
                  ref={sqlRef}
                  aria-label="SQL query"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  value={sql}
                  disabled={!!evaluation?.correct}
                  onChange={(e) => {
                    setSql(e.target.value);
                    setRunResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const el = e.currentTarget,
                        start = el.selectionStart;
                      setSql(sql.slice(0, start) + '  ' + sql.slice(el.selectionEnd));
                      requestAnimationFrame(() => {
                        el.selectionStart = el.selectionEnd = start + 2;
                      });
                    }
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      void submit(false);
                    }
                  }}
                />
              </div>
              <div className="editor-bottom">
                <button
                  className="text-button"
                  disabled={busy || !!evaluation?.correct}
                  onClick={() => {
                    setSql(question.starter);
                    setRunResult(null);
                  }}
                >
                  <RotateCcw size={13} />
                  Reset query
                </button>
                <span>Ctrl / ⌘ + Enter to run</span>
              </div>
            </div>
          ) : (
            <div className="answer-options" role="radiogroup" aria-label="Choose an answer">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={answer === i}
                  disabled={!!evaluation?.correct}
                  className={`answer-option ${answer === i ? 'chosen' : ''} ${evaluation?.correct && answer === i ? 'correct' : ''}`}
                  onClick={() => setAnswer(i)}
                >
                  <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
                  <span>{option}</span>
                  {answer === i && <Check size={18} />}
                </button>
              ))}
            </div>
          )}
          <div className="exercise-actions">
            <button
              className="text-button hint-button"
              onClick={() => {
                setHint(true);
                setAssisted(true);
              }}
              disabled={!!evaluation?.correct}
            >
              <Lightbulb size={17} />I need a hint
            </button>
            <div>
              {question.type === 'sql' && (
                <button
                  className="button secondary"
                  disabled={busy || !sql.trim() || !!evaluation?.correct}
                  onClick={() => void submit(false)}
                >
                  <Play size={15} />
                  {busy ? 'Running…' : 'Run query'}
                </button>
              )}
              <button
                className="button primary"
                disabled={
                  busy || (question.type === 'choice' && answer === null) || !!evaluation?.correct
                }
                onClick={() => void submit(true)}
              >
                {busy ? 'Checking…' : evaluation?.correct ? 'Correct!' : 'Check answer'}
                {evaluation?.correct ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>
          {hint && (
            <div className="hint-panel">
              <Lightbulb size={18} />
              <div>
                <strong>A little nudge</strong>
                <p>{question.hint}</p>
                <small>This attempt counts as guided practice.</small>
              </div>
            </div>
          )}
          {evaluation && (
            <div className={`feedback ${evaluation.correct ? 'success' : 'retry'}`} role="status">
              <span>{evaluation.correct ? <CheckCircle2 size={22} /> : <XCircle size={22} />}</span>
              <div>
                <h3>
                  {evaluation.correct
                    ? assisted
                      ? 'Nice work. Now you know the way.'
                      : 'You’ve got it.'
                    : 'Let’s work through this.'}
                </h3>
                <p>
                  {evaluation.correct
                    ? question.explanation
                    : evaluation.error
                      ? `SQLite says: ${evaluation.error}`
                      : evaluation.hiddenFailure
                        ? 'Your query matches the sample, but not the extra test data. Check ties, NULLs, filters, and hardcoded values.'
                        : 'This result doesn’t quite match yet. Review the concept below, then try again or practice a related question.'}
                </p>
                {evaluation.correct && (
                  <small>
                    {assisted
                      ? 'Guided success. Solve a fresh attempt without help to build mastery.'
                      : 'Independent success. This counts toward concept mastery.'}
                  </small>
                )}
              </div>
            </div>
          )}
          {result && (result.actual || result.error) && (
            <section className="result-panel">
              <div className="result-heading">
                <div className="result-tabs">
                  <button
                    className={resultTab === 'yours' ? 'selected' : ''}
                    onClick={() => setResultTab('yours')}
                  >
                    Your result
                  </button>
                  {evaluation && !runResult && evaluation.expected && (
                    <button
                      className={resultTab === 'expected' ? 'selected' : ''}
                      onClick={() => setResultTab('expected')}
                    >
                      Expected result
                    </button>
                  )}
                </div>
                {result.actual && <span>{result.actual.values.length} rows</span>}
              </div>
              {result.error ? (
                <p className="query-error" role="alert">
                  {result.error}
                </p>
              ) : (
                <DataTable
                  result={
                    (resultTab === 'expected' ? evaluation?.expected : result.actual) ?? {
                      columns: [],
                      values: [],
                    }
                  }
                />
              )}
            </section>
          )}
          <div className="concept-help">
            <button
              className="concept-help-toggle"
              aria-expanded={notes}
              onClick={() => {
                if (!notes && !evaluation?.correct) setAssisted(true);
                setNotes(!notes);
              }}
            >
              <span>
                <BookOpen size={17} />
                Understand the concept
              </span>
              <ChevronDown size={17} className={notes ? 'rotate' : ''} />
            </button>
            {notes && (
              <div className="inline-lesson">
                <Lesson topic={currentTopic} />
                {evaluation && !evaluation.correct && (
                  <>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSolution(!solution);
                        setAssisted(true);
                      }}
                    >
                      {solution ? 'Hide solution' : 'Walk me through the solution'}
                      <ChevronDown size={14} />
                    </button>
                    {solution && (
                      <div className="solution">
                        <p>{question.explanation}</p>
                        {question.type === 'sql' ? (
                          <pre>
                            <code>{question.solution}</code>
                          </pre>
                        ) : (
                          <p>
                            <strong>{question.options[question.answer]}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          {evaluation && (
            <div className="next-question">
              <span>
                {evaluation.correct
                  ? 'Ready for another step?'
                  : 'You can retry above or revisit this idea with another question.'}
              </span>
              <button className="button primary" onClick={next}>
                {completed.length === goal - 1
                  ? 'Finish session'
                  : evaluation.correct
                    ? 'Next question'
                    : 'Practice a related question'}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        <aside className="data-column">
          {question.type === 'sql' ? (
            <section className="data-card">
              <div className="card-heading">
                <h3>
                  <Database size={17} />
                  Your practice database
                </h3>
                <span className="status practicing">SQLite</span>
              </div>
              <p>A small company, a few customers, and plenty to discover.</p>
              <div className="filter-tabs data-tabs">
                <button
                  className={dataTab === 'schema' ? 'selected' : ''}
                  onClick={() => setDataTab('schema')}
                >
                  Schema
                </button>
                <button
                  className={dataTab === 'rows' ? 'selected' : ''}
                  onClick={() => setDataTab('rows')}
                >
                  Sample data
                </button>
              </div>
              {dataTab === 'schema' ? (
                <div className="schema-list">
                  {schema.map((t) => (
                    <details key={t.name} open={t.name === 'employees'}>
                      <summary>
                        <Database size={14} />
                        {t.name}
                        <ChevronDown size={14} />
                      </summary>
                      <ul>
                        {t.columns.map((c) => (
                          <li key={c}>
                            <code>{c.split(' ')[0]}</code>
                            <span>{c.split(' ').slice(1).join(' ')}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              ) : (
                <>
                  <label className="table-select-label">
                    Table
                    <select value={table} onChange={(e) => setTable(e.target.value)}>
                      {schema.map((t) => (
                        <option key={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                  {tableData ? (
                    <DataTable result={tableData} />
                  ) : (
                    <p className="muted">Loading sample data…</p>
                  )}
                </>
              )}
              <div className="database-note">
                <CircleHelp size={15} />
                <span>
                  Queries are checked on sample and extra data. Column order matters; aliases don’t.
                </span>
              </div>
            </section>
          ) : (
            <section className="data-card theory-note">
              <BookOpen size={26} />
              <h3>Think like an engineer.</h3>
              <p>Look for the tradeoff, the edge case, and the assumption behind each answer.</p>
              <p>Interview concepts include engine-specific behavior where it matters.</p>
            </section>
          )}
          <div className="practice-note">
            <Sparkles size={18} />
            <p>
              Understanding takes practice.
              <br />
              You can ask for a hint anytime.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
