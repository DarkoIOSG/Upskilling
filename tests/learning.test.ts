import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import type { SqlJsStatic } from 'sql.js';
import { questions, topics } from '../src/data/curriculum';
import { evaluateSql, equivalent, runQuery } from '../src/lib/sql-engine';
import {
  emptyProgress,
  mastery,
  nextQuestion,
  parseProgress,
  recordAttempt,
  streak,
  localDay,
} from '../src/lib/progress';
let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await initSqlJs();
});
describe('real SQL grading', () => {
  for (const q of questions.filter((q) => q.type === 'sql'))
    it(`accepts the reference solution for ${q.id}`, () => {
      if (q.type === 'sql')
        expect(evaluateSql(SQL, q.solution, q)).toMatchObject({ correct: true });
    });
  it('rejects hardcoded output that only matches sample data', () => {
    const q = questions.find((q) => q.id === 'null-1')!;
    if (q.type !== 'sql') throw Error();
    expect(evaluateSql(SQL, "SELECT 'Quinn' AS name", q)).toMatchObject({
      correct: false,
      hiddenFailure: true,
    });
  });
  it('checks row order when the task requests it', () => {
    const q = questions.find((q) => q.id === 'select-2')!;
    if (q.type !== 'sql') throw Error();
    expect(
      evaluateSql(SQL, 'SELECT name, salary FROM employees ORDER BY salary ASC, name ASC', q)
        .correct,
    ).toBe(false);
  });
  it('accepts equivalent SQL with different aliases', () => {
    const q = questions.find((q) => q.id === 'select-1')!;
    if (q.type !== 'sql') throw Error();
    expect(
      evaluateSql(SQL, 'SELECT name AS person, salary AS income FROM employees ORDER BY id DESC', q)
        .correct,
    ).toBe(true);
  });
  it('rejects mutation and multiple statements', () => {
    expect(() => runQuery(SQL, 'DELETE FROM employees RETURNING *')).toThrow(/readonly/);
    expect(() => runQuery(SQL, 'SELECT 1; SELECT 2;')).toThrow(/one SQL statement/);
    expect(runQuery(SQL, 'SELECT COUNT(*) FROM employees').values).toEqual([[8]]);
  });
  it('rejects malformed SQL and caps result size', () => {
    expect(() => runQuery(SQL, 'SELEC name FROM employees')).toThrow();
    expect(() =>
      runQuery(
        SQL,
        'WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<501) SELECT x FROM n',
      ),
    ).toThrow(/500 rows/);
  });
  it('preserves duplicate counts, NULL types and numeric tolerance', () => {
    expect(
      equivalent({ columns: ['a'], values: [[1], [1]] }, { columns: ['b'], values: [[1], [2]] }),
    ).toBe(false);
    expect(
      equivalent({ columns: ['a'], values: [[null]] }, { columns: ['b'], values: [[0]] }),
    ).toBe(false);
    expect(
      equivalent({ columns: ['a'], values: [[0.1 + 0.2]] }, { columns: ['b'], values: [[0.3]] }),
    ).toBe(true);
  });
});
describe('adaptive learning', () => {
  it('starts with foundations and rotates to another question after a gap', () => {
    let p = emptyProgress();
    expect(nextQuestion(p).id).toBe('select-1');
    p = recordAttempt(p, {
      questionId: 'select-1',
      topicId: 'select',
      correct: false,
      assisted: false,
      at: Date.now(),
    });
    expect(nextQuestion(p).topic).toBe('select');
    expect(nextQuestion(p).id).not.toBe('select-1');
  });
  it('requires independent solutions to distinct questions for mastery', () => {
    let p = emptyProgress();
    for (let i = 0; i < 3; i++)
      p = recordAttempt(p, {
        questionId: 'select-1',
        topicId: 'select',
        correct: true,
        assisted: false,
        at: Date.now(),
      });
    expect(mastery(p, 'select')).toBe(33);
    p = recordAttempt(p, {
      questionId: 'select-2',
      topicId: 'select',
      correct: true,
      assisted: true,
      at: Date.now(),
    });
    expect(mastery(p, 'select')).toBe(33);
    expect(p.topics.select.needsReview).toBe(true);
    for (const id of ['select-2', 'select-3'])
      p = recordAttempt(p, {
        questionId: id,
        topicId: 'select',
        correct: true,
        assisted: false,
        at: Date.now(),
      });
    expect(mastery(p, 'select')).toBe(100);
    expect(nextQuestion(p).topic).toBe('filter');
  });
  it('removes stale evidence after an incorrect review', () => {
    let p = emptyProgress();
    for (const id of ['select-1', 'select-2', 'select-3'])
      p = recordAttempt(p, {
        questionId: id,
        topicId: 'select',
        correct: true,
        assisted: false,
        at: Date.now(),
      });
    p = recordAttempt(p, {
      questionId: 'select-1',
      topicId: 'select',
      correct: false,
      assisted: false,
      at: Date.now(),
    });
    expect(mastery(p, 'select')).toBe(67);
    expect(nextQuestion(p).topic).toBe('select');
  });
  it('brings mastered concepts back when spaced review is due', () => {
    let p = emptyProgress();
    const now = Date.now();
    for (const id of ['select-1', 'select-2', 'select-3'])
      p = recordAttempt(p, {
        questionId: id,
        topicId: 'select',
        correct: true,
        assisted: false,
        at: now - 10 * 86400000,
      });
    expect(nextQuestion(p, [], undefined, now).topic).toBe('select');
  });
  it('supports practicing advanced topics directly', () => {
    expect(nextQuestion(emptyProgress(), [], 'patterns').topic).toBe('patterns');
  });
  it('counts consecutive local calendar days rather than UTC days', () => {
    let p = emptyProgress();
    const now = new Date(2026, 10, 8, 0, 30).getTime();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      p = recordAttempt(p, {
        questionId: 'select-1',
        topicId: 'select',
        correct: true,
        assisted: false,
        at: d.getTime(),
      });
    }
    expect(streak(p, now)).toBe(3);
    expect(localDay(now)).toBe('2026-11-8');
  });
});
describe('curriculum and backups', () => {
  it('has unique questions and three valid exercises per topic', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const t of topics) expect(questions.filter((q) => q.topic === t.id)).toHaveLength(3);
    for (const q of questions) if (q.type === 'choice') expect(q.options[q.answer]).toBeTruthy();
  });
  it('roundtrips progress and rejects corrupt imports', () => {
    const p = recordAttempt(emptyProgress(), {
      questionId: 'select-1',
      topicId: 'select',
      correct: true,
      assisted: false,
      at: Date.now(),
    });
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(() => parseProgress('{"version":2}')).toThrow();
    expect(() =>
      parseProgress(JSON.stringify({ ...p, attempts: [{ questionId: 'fake' }] })),
    ).toThrow();
    expect(() =>
      parseProgress(
        JSON.stringify({
          ...p,
          topics: {
            select: { masteredQuestions: ['filter-1'], needsReview: false, interval: 1, dueAt: 0 },
          },
        }),
      ),
    ).toThrow();
  });
});
