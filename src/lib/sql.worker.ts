import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { evaluateSql, runQuery } from './sql-engine';
import { questionById } from '../data/curriculum';
const engine = initSqlJs({ locateFile: () => wasmUrl });
self.onmessage = async (event: MessageEvent<{ sql: string; questionId?: string }>) => {
  try {
    const SQL = await engine;
    const q = event.data.questionId ? questionById[event.data.questionId] : undefined;
    self.postMessage(
      q?.type === 'sql'
        ? evaluateSql(SQL, event.data.sql, q)
        : { actual: runQuery(SQL, event.data.sql) },
    );
  } catch (e) {
    self.postMessage({ error: e instanceof Error ? e.message : 'The SQL engine could not start.' });
  }
};
