import type { MiniLesson } from '../lib/types';

// These checks are learning aids, separate from the stable, graded question bank.
export const lessons: Record<string, MiniLesson> = {
  select: {
    mentalModel:
      'Describe the result before writing SQL: one row per employee, two columns, highest salary first. That sentence becomes your query plan.',
    tips: [
      'List columns explicitly so a new table column does not silently change your result.',
      'For a repeatable top N, finish ORDER BY with a unique key such as id.',
    ],
    pitfall:
      'LIMIT chooses how many rows to return; it does not define which rows come first. Pair it with ORDER BY.',
    checks: [
      {
        prompt: 'What order does SELECT name FROM employees guarantee?',
        options: ['Alphabetical by name', 'No guaranteed order', 'Primary key order'],
        answer: 1,
        explanation:
          'A table has no promised presentation order. Only an explicit ORDER BY defines the output order.',
      },
      {
        prompt:
          'Two employees share a salary. Which ordering always breaks the tie if id is unique?',
        options: ['ORDER BY salary DESC', 'LIMIT 2', 'ORDER BY salary DESC, id ASC'],
        answer: 2,
        explanation:
          'The unique id provides a final tie breaker. Salary alone leaves peers unordered, and LIMIT only restricts the row count.',
      },
    ],
    reference: {
      title: 'SQLite: ordering results',
      url: 'https://www.sqlite.org/lang_select.html#orderby',
    },
  },
  filter: {
    mentalModel:
      'Read a WHERE clause as a yes/no test for each row. Only true passes; false and unknown are discarded.',
    tips: [
      'Add parentheses around OR alternatives before combining them with AND.',
      'For timestamp ranges, use a half-open interval: value >= start AND value < next_start. This avoids guessing the last instant of a day.',
    ],
    pitfall:
      'BETWEEN includes both endpoints. Adjacent BETWEEN ranges can count a shared boundary twice.',
    checks: [
      {
        prompt: 'How is A OR B AND C grouped when there are no parentheses?',
        options: ['(A OR B) AND C', 'A OR (B AND C)', 'All conditions must be true'],
        answer: 1,
        explanation:
          'AND has higher precedence than OR. Write (A OR B) AND C explicitly when C must apply to both alternatives.',
      },
      {
        prompt: 'Does salary BETWEEN 70000 AND 85000 include a salary of 85000?',
        options: [
          'Yes, both boundaries are included',
          'No, only the lower boundary is included',
          'Only when ORDER BY is present',
        ],
        answer: 0,
        explanation: 'BETWEEN is inclusive: salary >= 70000 AND salary <= 85000.',
      },
    ],
    reference: {
      title: 'SQLite: expressions and operators',
      url: 'https://www.sqlite.org/lang_expr.html',
    },
  },
  null: {
    mentalModel:
      'Treat NULL as an unanswered question. An unknown salary is not evidence that the salary is zero, or that it differs from a particular number.',
    tips: [
      'Use IS NULL to find missing values and IS NOT NULL to find known values.',
      'Use COALESCE for an intentional fallback, after deciding what a missing value means in the domain.',
    ],
    pitfall:
      'WHERE salary <> 80000 also excludes NULL salaries. Add OR salary IS NULL if missing salaries should be included.',
    checks: [
      {
        prompt: 'For values 10, NULL, and 20, what does COUNT(value) return?',
        options: ['3', 'NULL', '2'],
        answer: 2,
        explanation:
          'COUNT(value) ignores NULL and counts the two known values. COUNT(*) would count all three rows.',
      },
      {
        prompt: 'Which predicate finds rows with an unknown salary?',
        options: ['salary IS NULL', 'salary = NULL', 'salary = 0'],
        answer: 0,
        explanation:
          'IS NULL directly tests for a missing value. Equality with NULL produces unknown; zero is an ordinary known number.',
      },
    ],
    reference: {
      title: 'SQLite: NULL and aggregate functions',
      url: 'https://www.sqlite.org/lang_aggfunc.html',
    },
  },
  aggregate: {
    mentalModel:
      'Grouping changes the unit of the result. If you group by department, each output row describes a department rather than an employee.',
    tips: [
      'Write down the grouping key first, then choose what each aggregate should summarize.',
      'Filter unwanted input rows with WHERE before calculating totals; use HAVING for conditions on those totals.',
    ],
    pitfall:
      'SQLite allows some ungrouped, unaggregated columns, but their values can come from an arbitrary row. Group or aggregate every selected column for predictable results.',
    checks: [
      {
        prompt:
          'Where should COUNT(*) >= 3 go to keep only departments with at least three employees?',
        options: ['WHERE', 'ORDER BY', 'HAVING'],
        answer: 2,
        explanation:
          'HAVING filters groups after COUNT has been computed. WHERE filters individual input rows before grouping.',
      },
      {
        prompt: 'For salaries 10, NULL, and 20, what is AVG(salary)?',
        options: ['10', '15', 'NULL'],
        answer: 1,
        explanation:
          'AVG ignores NULL inputs: (10 + 20) / 2 = 15. Replacing NULL with zero first would change the meaning and the result.',
      },
    ],
    reference: {
      title: 'SQLite: grouping and HAVING',
      url: 'https://www.sqlite.org/lang_select.html#resultset',
    },
  },
  joins: {
    mentalModel:
      'Imagine drawing a line for every matching pair of rows. An inner join returns one row for each line, even when several lines start from the same parent.',
    tips: [
      'Before a join, identify whether each side is unique on the joining key.',
      'If you need totals at the parent level, consider aggregating child rows before joining them to other child tables.',
    ],
    pitfall:
      'DISTINCT can hide a mistaken join. Fix the relationship or aggregation level before removing duplicate output rows.',
    checks: [
      {
        prompt:
          'One customer has three matching orders. How many rows does their customer-to-orders inner join produce?',
        options: ['One', 'Three', 'Zero'],
        answer: 1,
        explanation:
          'Each matching customer/order pair becomes a row. The customer details repeat once per order.',
      },
      {
        prompt: 'What makes a self join possible to read unambiguously?',
        options: [
          'DISTINCT on every column',
          'Two physical copies of the table',
          'Different aliases for the two roles',
        ],
        answer: 2,
        explanation:
          'Aliases such as employee and manager identify two roles of the same table within one query.',
      },
    ],
    reference: {
      title: 'SQLite: joins',
      url: 'https://www.sqlite.org/lang_select.html#fromclause',
    },
  },
  outer: {
    mentalModel:
      'A LEFT JOIN promises every left row a place in the result. An unmatched row gets NULL placeholders on the right.',
    tips: [
      'Put right-side status conditions in ON when customers with zero qualifying orders must remain.',
      'For an anti join, test a right-side key that cannot be NULL in a real matched row.',
    ],
    pitfall:
      "WHERE o.status = 'completed' discards the NULL-extended rows from a LEFT JOIN, removing customers without completed orders.",
    checks: [
      {
        prompt:
          'After a customer LEFT JOIN orders, what does COUNT(o.id) return for a customer with no orders if o.id is a non-NULL key?',
        options: ['1', 'NULL', '0'],
        answer: 2,
        explanation:
          'The placeholder row has a NULL order id, so COUNT(o.id) is zero. COUNT(*) would count the placeholder row as one.',
      },
      {
        prompt:
          "Keep every customer and match only completed orders. Where should o.status = 'completed' go?",
        options: ['In the JOIN ON condition', 'In WHERE after the join', 'In ORDER BY'],
        answer: 0,
        explanation:
          'ON restricts which orders match while preserving every customer. A WHERE equality test rejects unmatched NULL placeholders.',
      },
    ],
    reference: {
      title: 'SQLite: outer join filtering',
      url: 'https://www.sqlite.org/lang_select.html#whereclause',
    },
  },
  subqueries: {
    mentalModel:
      'EXISTS asks a yes/no question about a related set. It does not need to return or count every match in the outer result.',
    tips: [
      'Use EXISTS when you need customers who have an order, rather than customer/order pairs.',
      'Read a correlated subquery with one outer row in mind, then check that the correlation key connects the intended rows.',
    ],
    pitfall:
      'NOT IN can produce unknown when its right-hand set contains NULL. NOT EXISTS with an explicit matching condition avoids this NULL trap.',
    checks: [
      {
        prompt:
          'A customer has five matching orders. How many copies of that customer does WHERE EXISTS produce?',
        options: ['One', 'Five', 'One for each selected order column'],
        answer: 0,
        explanation:
          'EXISTS is a predicate on the outer row. Any number of matching orders makes it true without multiplying that customer row.',
      },
      {
        prompt: 'In SQLite, what is 2 NOT IN (1, NULL)?',
        options: ['True', 'Unknown (NULL)', 'False'],
        answer: 1,
        explanation:
          'There is no known equal value, but the missing value might equal 2. The result is unknown and does not pass WHERE.',
      },
    ],
    reference: {
      title: 'SQLite: IN, NOT IN, and EXISTS',
      url: 'https://www.sqlite.org/lang_expr.html#in_op',
    },
  },
  ctes: {
    mentalModel:
      'A CTE is a named step in a data transformation. Its name should say what its rows represent, such as customer_totals.',
    tips: [
      'While debugging, replace the final SELECT with SELECT * FROM your_cte to inspect an intermediate step.',
      'Use ELSE 0 in conditional sums when nonmatching input rows should contribute zero.',
    ],
    pitfall:
      'A CTE is not a promise of caching or speed. Optimizers may inline or materialize it; inspect the actual plan.',
    checks: [
      {
        prompt: 'Does rewriting a query with WITH guarantee faster execution?',
        options: [
          'Yes, because CTEs are always cached',
          'Yes, because WITH creates an index',
          'No; the plan and workload determine performance',
        ],
        answer: 2,
        explanation:
          'WITH gives an intermediate result a name. It does not automatically create an index or guarantee materialization or faster execution.',
      },
      {
        prompt:
          "An existing group has rows but none are completed. What is SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)?",
        options: ['0', 'The sum of every amount', 'The number of rows'],
        answer: 0,
        explanation:
          'Each nonmatching row contributes zero, so the group total is zero. Without ELSE 0, every CASE result would be NULL and SUM would be NULL.',
      },
    ],
    reference: {
      title: 'SQLite: common table expressions',
      url: 'https://www.sqlite.org/lang_with.html',
    },
  },
  windows: {
    mentalModel:
      'GROUP BY collapses rows into summaries. A window calculation attaches a summary or position while keeping each underlying row.',
    tips: [
      'For exactly N rows per group, use ROW_NUMBER with a deterministic tie breaker.',
      'For N distinct salary levels including ties, use DENSE_RANK over salary alone and filter in an outer query.',
    ],
    pitfall:
      'Adding a unique id inside RANK or DENSE_RANK ordering removes salary ties. Only add that key if breaking ties matches the question.',
    checks: [
      {
        prompt: 'For salaries 100, 100, 90 ordered descending, what are the DENSE_RANK values?',
        options: ['1, 1, 3', '1, 1, 2', '1, 2, 3'],
        answer: 1,
        explanation:
          'Equal salaries share a rank, and DENSE_RANK leaves no gap. RANK would give 1, 1, 3; ROW_NUMBER gives unique positions.',
      },
      {
        prompt:
          'Which function is suited to selecting exactly two employees per department when at least two exist?',
        options: [
          'RANK ordered only by salary',
          'DENSE_RANK ordered only by salary',
          'ROW_NUMBER with a stable ordering',
        ],
        answer: 2,
        explanation:
          'ROW_NUMBER gives each employee a unique position. RANK and DENSE_RANK may select more than two employees when salaries tie.',
      },
    ],
    reference: {
      title: 'SQLite: ranking functions',
      url: 'https://www.sqlite.org/windowfunctions.html#biwinfunc',
    },
  },
  frames: {
    mentalModel:
      'The partition chooses the group, the ordering chooses the sequence, and the frame chooses which rows an aggregate sees at each position.',
    tips: [
      'Use ROWS BETWEEN 2 PRECEDING AND CURRENT ROW for up to three observations, not necessarily three calendar days.',
      'Add a final ORDER BY when the displayed output must follow the same sequence as the window calculation.',
    ],
    pitfall:
      'With an ordered aggregate window, the default RANGE frame includes peers sharing the current sort value. Use an explicit ROWS frame for a row-by-row running total.',
    checks: [
      {
        prompt: 'At the first row, how many rows are in ROWS BETWEEN 2 PRECEDING AND CURRENT ROW?',
        options: ['One', 'Three padded with NULL rows', 'Zero'],
        answer: 0,
        explanation:
          'A frame only includes available rows. At the beginning of the partition, there are no preceding rows to include.',
      },
      {
        prompt: 'Does ORDER BY inside OVER guarantee the final display order?',
        options: ['Yes, for the whole result', 'No; use an outer ORDER BY', 'Only if LAG is used'],
        answer: 1,
        explanation:
          'Window ordering defines a calculation sequence. The outer query needs its own ORDER BY to guarantee presentation order.',
      },
    ],
    reference: {
      title: 'SQLite: window frames',
      url: 'https://www.sqlite.org/windowfunctions.html#frame_specifications',
    },
  },
  sets: {
    mentalModel:
      'A set operation stacks or compares whole rows from compatible result shapes. A join pairs rows using a relationship.',
    tips: [
      'Choose UNION ALL when duplicate rows are meaningful or the inputs are already disjoint.',
      'Align the meaning of each column position on both sides; matching column counts alone do not ensure a meaningful result.',
    ],
    pitfall:
      'UNION removes duplicate complete rows, not just duplicate values in the first column.',
    checks: [
      {
        prompt:
          'The first input returns A, A and the second returns A, B. What does UNION ALL preserve?',
        options: ['A, B only', 'A, A, B', 'Three A rows and one B row'],
        answer: 2,
        explanation:
          'UNION ALL keeps all four input rows. UNION would return one A and one B, with no guaranteed order.',
      },
      {
        prompt: 'Which operation returns distinct rows in the first query but not in the second?',
        options: ['INTERSECT', 'EXCEPT', 'INNER JOIN'],
        answer: 1,
        explanation:
          'EXCEPT is directional set difference. INTERSECT returns rows shared by both inputs.',
      },
    ],
    reference: {
      title: 'SQLite: compound SELECT statements',
      url: 'https://www.sqlite.org/lang_select.html#compound',
    },
  },
  recursive: {
    mentalModel:
      'Start with a frontier of anchor rows, find the next related rows, and repeat until there are no new rows to explore.',
    tips: [
      'Test the anchor alone, then test one recursive step before running the whole traversal.',
      'For graphs that may cycle, track visited identifiers or use a deliberate depth bound with an explicit truncation policy.',
    ],
    pitfall:
      'UNION compares the entire row. A cycle that keeps increasing depth still produces distinct rows, so UNION alone may not stop it.',
    checks: [
      {
        prompt: 'Which part of a recursive CTE supplies the starting rows?',
        options: ['The anchor query', 'The final ORDER BY', 'The recursive join condition'],
        answer: 0,
        explanation:
          'The anchor runs without referring to the recursive result. The recursive step then expands from those starting rows.',
      },
      {
        prompt:
          'A traversal returns (id, depth) and revisits the same id at increasing depths. Does UNION guarantee termination?',
        options: [
          'Yes, because the id repeats',
          'Yes, because depth is numeric',
          'No, the complete rows are different',
        ],
        answer: 2,
        explanation:
          'Rows such as (1, 0) and (1, 2) are distinct. Add cycle detection or an intentional bound rather than relying on whole-row deduplication.',
      },
    ],
    reference: {
      title: 'SQLite: recursive CTEs',
      url: 'https://www.sqlite.org/lang_with.html#recursive_common_table_expressions',
    },
  },
  indexes: {
    mentalModel:
      'Think of a composite B-tree index as a sorted directory: entries are sorted by the first key, then by later keys within each first-key value.',
    tips: [
      'For a query with customer equality and a date range, consider (customer_id, ordered_at), then verify with EXPLAIN QUERY PLAN.',
      'Measure both reads and writes: every extra index also needs maintenance when its indexed values change.',
    ],
    pitfall:
      "An available index is not proof of a faster plan. Data distribution, selectivity, ordering, and table lookups affect the optimizer's choice.",
    checks: [
      {
        prompt:
          'Which index is a natural candidate for WHERE customer_id = ? AND ordered_at >= ? when these are the only predicates?',
        options: ['(amount, status)', '(customer_id, ordered_at)', '(status, amount)'],
        answer: 1,
        explanation:
          'The leading equality key narrows the customer slice, and the following date key supports a range within that slice. Confirm the actual plan.',
      },
      {
        prompt: 'What is a real cost of adding an index?',
        options: [
          'Extra storage and write maintenance',
          'Loss of all duplicate table rows',
          'Every SELECT must use it',
        ],
        answer: 0,
        explanation:
          'Indexes consume space and must be maintained on relevant writes. The optimizer can still choose a scan or another index.',
      },
    ],
    reference: { title: 'SQLite: query planning', url: 'https://www.sqlite.org/queryplanner.html' },
  },
  transactions: {
    mentalModel:
      'A transaction is a boundary around a business operation. Define what must remain true, then choose statements and isolation that preserve it under concurrency.',
    tips: [
      'Prefer an atomic expression such as SET balance = balance - 100 over reading a balance into the app and writing back a calculated constant.',
      'When a conditional debit changes zero rows, roll back the transfer instead of crediting the recipient. Keep both changes in one transaction.',
    ],
    pitfall:
      'BEGIN alone does not solve every race. Isolation guarantees, locks, and retry requirements depend on the database engine.',
    checks: [
      {
        prompt: 'Which ACID property means a transfer is applied entirely or not at all?',
        options: ['Durability', 'Isolation', 'Atomicity'],
        answer: 2,
        explanation:
          'Atomicity groups changes into one all-or-nothing unit. The application must still check failures and roll back when the business operation cannot finish.',
      },
      {
        prompt:
          'PostgreSQL reports a serialization failure. What should the application generally retry?',
        options: [
          'Only COMMIT with the old results',
          'The whole transaction, including its reads and decisions',
          'Only the last SELECT outside a transaction',
        ],
        answer: 1,
        explanation:
          'PostgreSQL can abort a serializable transaction to preserve correctness. Retry the complete transaction so its decisions use a fresh consistent view.',
      },
    ],
    reference: {
      title: 'PostgreSQL: transaction isolation and retries',
      url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
    },
  },
  modeling: {
    mentalModel:
      'A schema is a set of promises about valid data. Store each fact in a clear place and let constraints reject states your application cannot safely interpret.',
    tips: [
      'For a positive quantity, combine NOT NULL with CHECK (quantity > 0): each protects a different rule.',
      'In SQLite, enable PRAGMA foreign_keys = ON for each connection before relying on foreign key enforcement.',
    ],
    pitfall:
      'In SQLite a CHECK expression that evaluates to NULL is not a violation. CHECK (quantity > 0) by itself still permits a NULL quantity.',
    checks: [
      {
        prompt: 'In SQLite, which definition requires a known, positive quantity?',
        options: [
          'quantity INTEGER NOT NULL CHECK (quantity > 0)',
          'quantity INTEGER CHECK (quantity > 0)',
          'quantity INTEGER DEFAULT 1',
        ],
        answer: 0,
        explanation:
          'NOT NULL rejects missing quantities and CHECK rejects zero or negative quantities. A default does not prevent an explicit invalid value.',
      },
      {
        prompt: 'What does PRIMARY KEY (order_id, product_id) express?',
        options: [
          'Each product may appear in only one order',
          'Each order may contain only one product',
          'Each order/product pair identifies a line',
        ],
        answer: 2,
        explanation:
          'The pair must be unique. Each individual order or product can appear in multiple different pairs. In SQLite, explicitly use NOT NULL for ordinary composite key columns when required.',
      },
    ],
    reference: {
      title: 'SQLite: table constraints',
      url: 'https://www.sqlite.org/lang_createtable.html',
    },
  },
  patterns: {
    mentalModel:
      'Translate the requirement into a familiar shape: positions within groups, absence of missing requirements, or a cursor after the last ordered row.',
    tips: [
      'For keyset pagination, put every ordering key in the cursor and include a unique final tie breaker.',
      'For an “every required item” query, ask whether there is any required item missing. No missing item means the requirement is satisfied.',
    ],
    pitfall:
      'A cursor with only a timestamp can skip rows sharing that timestamp. Include a unique id and keep the cursor comparison aligned with the sort directions.',
    checks: [
      {
        prompt:
          'For ORDER BY ordered_at ASC, id ASC, which cursor condition continues after (:date, :id)?',
        options: [
          'ordered_at > :date only',
          'ordered_at > :date OR (ordered_at = :date AND id > :id)',
          'id > :id only',
        ],
        answer: 1,
        explanation:
          'Later dates come next, followed by larger ids on the same date. Both ordering keys must be represented to avoid skipping tied timestamps.',
      },
      {
        prompt:
          'A double NOT EXISTS query means “no required item is missing.” What happens if the required-item set is empty?',
        options: [
          'Every candidate qualifies',
          'No candidate qualifies',
          'The query must raise an error',
        ],
        answer: 0,
        explanation:
          'There is no missing required item when there are no requirements. This is vacuous truth; add a separate existence rule if the business needs a nonempty requirement set.',
      },
    ],
    reference: {
      title: 'SQLite: EXISTS and subqueries',
      url: 'https://www.sqlite.org/lang_expr.html#the_exists_operator',
    },
  },
};
