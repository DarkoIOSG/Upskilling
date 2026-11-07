import type { Database, SqlJsStatic } from 'sql.js';
import type { Evaluation, QueryResult, SqlQuestion } from './types';
import { seed, hiddenSeed } from '../data/database';
export function execute(db: Database, sql: string): QueryResult {
  if (!sql.trim()) throw new Error('Write a query first. You can start with SELECT.');
  if (sql.length > 12000) throw new Error('Keep your query under 12,000 characters.');
  // SQLite enforces read-only execution, including statements nested in a CTE.
  db.run('PRAGMA query_only = ON;');
  let result: QueryResult | undefined;
  let count = 0;
  for (const stmt of db.iterateStatements(sql)) {
    count++;
    if (count > 1) throw new Error('Run one SQL statement at a time.');
    const columns = stmt.getColumnNames();
    const values: QueryResult['values'] = [];
    while (stmt.step()) {
      if (values.length >= 500)
        throw new Error('This query returns over 500 rows. Narrow the result or add LIMIT.');
      values.push(stmt.get().map((v) => (v instanceof Uint8Array ? '[binary]' : v)));
    }
    result = { columns, values };
  }
  if (!result || !result.columns.length) throw new Error('Return a result using SELECT or WITH.');
  return result;
}
function cellEqual(a: string | number | null, b: string | number | null) {
  if (typeof a === 'number' && typeof b === 'number')
    return Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
  return a === b;
}
export function equivalent(a: QueryResult, b: QueryResult, ordered = false): boolean {
  if (a.columns.length !== b.columns.length || a.values.length !== b.values.length) return false;
  const rowsEqual = (x: QueryResult['values'][number], y: QueryResult['values'][number]) =>
    x.length === y.length && x.every((v, i) => cellEqual(v, y[i]));
  if (ordered) return a.values.every((r, i) => rowsEqual(r, b.values[i]));
  // Preserve duplicates while accepting harmless aliases and unordered result sets.
  const remaining = [...b.values];
  return a.values.every((r) => {
    const i = remaining.findIndex((x) => rowsEqual(r, x));
    if (i < 0) return false;
    remaining.splice(i, 1);
    return true;
  });
}
export function runQuery(SQL: SqlJsStatic, sql: string): QueryResult {
  const db = new SQL.Database();
  try {
    db.run(seed);
    return execute(db, sql);
  } finally {
    db.close();
  }
}
export function evaluateSql(SQL: SqlJsStatic, sql: string, q: SqlQuestion): Evaluation {
  const db = new SQL.Database();
  try {
    db.run(seed);
    const actual = execute(db, sql);
    const expected = execute(db, q.solution);
    if (!equivalent(actual, expected, q.ordered)) return { correct: false, actual, expected };
    db.run('PRAGMA query_only = OFF;');
    db.run(hiddenSeed);
    const extra = execute(db, sql);
    const extraExpected = execute(db, q.solution);
    const correct = equivalent(extra, extraExpected, q.ordered);
    return { correct, actual, expected, hiddenFailure: !correct };
  } catch (e) {
    return {
      correct: false,
      error: e instanceof Error ? e.message : 'The query could not be executed.',
    };
  } finally {
    db.close();
  }
}
