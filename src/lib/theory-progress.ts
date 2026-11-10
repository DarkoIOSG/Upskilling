import { theoryLessons, theoryQuestions, theoryQuestionById } from '../data/theory';
import { topicProgress } from './progress';
import type { Progress } from './types';
import type { TheoryCheck } from './theory-types';

export function theoryMastery(progress: Progress, id: string): number {
  const questions = theoryQuestions.filter((q) => q.lessonId === id);
  const evidence = new Set(topicProgress(progress, id).masteredQuestions);
  return questions.length
    ? Math.round((100 * questions.filter((q) => evidence.has(q.id)).length) / questions.length)
    : 0;
}

export function theoryDue(progress: Progress, now = Date.now()): string[] {
  return theoryLessons
    .filter((l) => {
      const p = topicProgress(progress, l.id);
      return p.needsReview || (p.dueAt > 0 && p.dueAt <= now);
    })
    .map((l) => l.id);
}

// A focused quiz remains inside its lesson. Mixed review prioritizes gaps, due
// lessons, and unfinished questions before moving through the curriculum.
export function nextTheoryQuestion(
  progress: Progress,
  excluded: string[] = [],
  focus?: string,
  now = Date.now(),
): TheoryCheck {
  const pool = theoryQuestions.filter((q) => !focus || q.lessonId === focus);
  const available = pool.filter((q) => !excluded.includes(q.id));
  const candidates = available.length ? available : pool;
  const last = progress.attempts.filter((a) => theoryQuestionById[a.questionId]).at(-1);
  const score = (q: TheoryCheck) => {
    const p = topicProgress(progress, q.lessonId);
    const learned = p.masteredQuestions.includes(q.id);
    const due = p.dueAt > 0 && p.dueAt <= now;
    let value = -theoryLessons.findIndex((l) => l.id === q.lessonId) * 4;
    if (p.needsReview) value += 4000;
    else if (due) value += 3000;
    else if (theoryMastery(progress, q.lessonId) === 100) value -= 5000;
    if (!learned) value += 500;
    if (q.id === last?.questionId) value -= 300;
    return value;
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0];
}
