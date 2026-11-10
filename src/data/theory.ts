import { designLessons } from './theory-design';
import { systemLessons } from './theory-systems';

export const theoryModules = [
  'Design foundations',
  'Modelling and normalization',
  'SQL and applied design',
  'Inside the database',
  'Transactions and operations',
] as const;
export const theoryLessons = [...designLessons, ...systemLessons];
export const theoryLessonById = Object.fromEntries(theoryLessons.map((l) => [l.id, l]));
export const theoryQuestions = theoryLessons.flatMap((l) => l.checks);
export const theoryQuestionById = Object.fromEntries(theoryQuestions.map((q) => [q.id, q]));
