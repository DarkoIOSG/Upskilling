import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { topics } from '../src/data/curriculum';
import { lessons } from '../src/data/lessons';
import { runQuery } from '../src/lib/sql-engine';

describe('lesson coverage and answer integrity', () => {
  it('covers the curriculum without orphaned or ambiguous checks', () => {
    expect(Object.keys(lessons).sort()).toEqual(topics.map((topic) => topic.id).sort());
    for (const lesson of Object.values(lessons)) {
      expect(lesson.checks).toHaveLength(2);
      for (const check of lesson.checks) {
        expect(Number.isInteger(check.answer)).toBe(true);
        expect(check.options[check.answer]).toBeTruthy();
        expect(new Set(check.options).size).toBe(check.options.length);
        expect(check.explanation.length).toBeGreaterThan(30);
      }
    }
  });
});

describe('SQL behavior taught by the understanding checks', () => {
  let SQL: SqlJsStatic;
  beforeAll(async () => {
    SQL = await initSqlJs();
  });
  const examples = [
    [
      'NULL counts and averages',
      'WITH sample(v) AS (VALUES (10), (NULL), (20)) SELECT COUNT(*), COUNT(v), AVG(v) FROM sample',
      [[3, 2, 15]],
    ],
    ['inclusive BETWEEN boundaries', 'SELECT 85000 BETWEEN 70000 AND 85000', [[1]]],
    ['NULL in a NOT IN set', 'SELECT 2 NOT IN (1, NULL)', [[null]]],
    [
      'dense ranking ties',
      'WITH sample(v) AS (VALUES (100), (100), (90)) SELECT DENSE_RANK() OVER (ORDER BY v DESC) FROM sample ORDER BY v DESC',
      [[1], [1], [2]],
    ],
    [
      'partial window frames',
      'WITH sample(id) AS (VALUES (1), (2), (3)) SELECT COUNT(*) OVER (ORDER BY id ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) FROM sample ORDER BY id',
      [[1], [2], [3]],
    ],
    [
      'UNION ALL preserves duplicates',
      "WITH a(v) AS (VALUES ('A'), ('A')), b(v) AS (VALUES ('A'), ('B')), combined AS (SELECT v FROM a UNION ALL SELECT v FROM b) SELECT v, COUNT(*) FROM combined GROUP BY v ORDER BY v",
      [
        ['A', 3],
        ['B', 1],
      ],
    ],
    [
      'zero matches after an outer join',
      'WITH c(id) AS (VALUES (1)), o(id, customer_id) AS (SELECT 1, 2) SELECT COUNT(*), COUNT(o.id) FROM c LEFT JOIN o ON o.customer_id = c.id',
      [[1, 0]],
    ],
    [
      'conditional sums without matches',
      "WITH sample(status, amount) AS (VALUES ('pending', 10), ('pending', 20)) SELECT SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), SUM(CASE WHEN status = 'completed' THEN amount END) FROM sample",
      [[0, null]],
    ],
    [
      'empty requirements satisfy every candidate',
      'WITH candidates(id) AS (VALUES (1), (2)), required(id) AS (SELECT 1 WHERE 0), owned(candidate_id, item_id) AS (SELECT 1, 1 WHERE 0) SELECT c.id FROM candidates c WHERE NOT EXISTS (SELECT 1 FROM required r WHERE NOT EXISTS (SELECT 1 FROM owned o WHERE o.candidate_id = c.id AND o.item_id = r.id)) ORDER BY c.id',
      [[1], [2]],
    ],
    [
      'keyset pagination preserves timestamp ties',
      "WITH sample(id, ordered_at) AS (VALUES (1, '2024-01-01'), (2, '2024-01-01'), (3, '2024-01-02')) SELECT id FROM sample WHERE ordered_at > '2024-01-01' OR (ordered_at = '2024-01-01' AND id > 1) ORDER BY ordered_at, id",
      [[2], [3]],
    ],
  ] as const;
  for (const [name, query, expected] of examples) {
    it(name, () => {
      expect(runQuery(SQL, query).values).toEqual(expected);
    });
  }
  it('CHECK alone permits NULL, while NOT NULL rejects it', () => {
    const db = new SQL.Database();
    try {
      db.run(
        'CREATE TABLE permissive (quantity INTEGER CHECK (quantity > 0)); INSERT INTO permissive VALUES (NULL);',
      );
      expect(db.exec('SELECT quantity FROM permissive')[0].values).toEqual([[null]]);
      db.run('CREATE TABLE strict_quantity (quantity INTEGER NOT NULL CHECK (quantity > 0));');
      expect(() => db.run('INSERT INTO strict_quantity VALUES (NULL)')).toThrow(/NOT NULL/);
      expect(() => db.run('INSERT INTO strict_quantity VALUES (0)')).toThrow(/CHECK/);
    } finally {
      db.close();
    }
  });
});
