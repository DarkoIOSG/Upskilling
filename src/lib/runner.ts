import type { Evaluation } from './types';
export function runSql(sql: string, questionId?: string): Promise<Evaluation> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' });
    const finish = (value: Evaluation) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(value);
    };
    const timer = setTimeout(
      () =>
        finish({
          correct: false,
          error:
            'This query took too long. Check your joins or recursive stopping condition, then try again.',
        }),
      5000,
    );
    worker.onmessage = (event) => finish(event.data);
    worker.onerror = () =>
      finish({
        correct: false,
        error: 'The SQL engine could not load. Check your connection and try again.',
      });
    worker.postMessage({ sql, questionId });
  });
}
