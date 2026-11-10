import { questions, topics } from '../data/curriculum';
import { theoryLessons, theoryQuestions, theoryQuestionById } from '../data/theory';
import type { Attempt, Progress, Question, TopicProgress } from './types';
const DAY = 86400000;
export const STORAGE_KEY = 'upskilling.progress.v1';
export const emptyProgress = (): Progress => ({
  version: 1,
  attempts: [],
  topics: {},
  dailyGoal: 5,
});
export function parseProgress(text: string): Progress {
  const data = JSON.parse(text) as Progress;
  if (
    data.version !== 1 ||
    !Array.isArray(data.attempts) ||
    !data.topics ||
    !Number.isInteger(data.dailyGoal) ||
    data.dailyGoal < 1 ||
    data.dailyGoal > 50
  )
    throw new Error('This is not a valid Upskilling progress file.');
  const allQuestions = [
    ...questions,
    ...theoryQuestions.map((q) => ({ id: q.id, topic: q.lessonId })),
  ];
  const allTopics = [...topics, ...theoryLessons];
  const ids = new Set(allQuestions.map((q) => q.id));
  for (const a of data.attempts) {
    const q = allQuestions.find((q) => q.id === a.questionId);
    if (
      !q ||
      q.topic !== a.topicId ||
      typeof a.correct !== 'boolean' ||
      typeof a.assisted !== 'boolean' ||
      !Number.isFinite(a.at)
    )
      throw new Error('The progress file contains an invalid attempt.');
  }
  for (const [id, p] of Object.entries(data.topics)) {
    if (
      !allTopics.some((t) => t.id === id) ||
      !Array.isArray(p.masteredQuestions) ||
      !p.masteredQuestions.every(
        (qid) => ids.has(qid) && allQuestions.find((q) => q.id === qid)?.topic === id,
      ) ||
      typeof p.needsReview !== 'boolean' ||
      !Number.isFinite(p.dueAt) ||
      !Number.isFinite(p.interval) ||
      p.interval < 0
    )
      throw new Error('The progress file contains invalid topic data.');
  }
  return data;
}
export function loadProgress(): Progress {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? parseProgress(text) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}
export function topicProgress(p: Progress, id: string): TopicProgress {
  return p.topics[id] ?? { masteredQuestions: [], needsReview: false, dueAt: 0, interval: 0 };
}
export function mastery(p: Progress, id: string): number {
  const t = topicProgress(p, id);
  return Math.round(
    (new Set(t.masteredQuestions).size / questions.filter((q) => q.topic === id).length) * 100,
  );
}
export function recordAttempt(p: Progress, a: Attempt): Progress {
  const prev = topicProgress(p, a.topicId);
  const independent = a.correct && !a.assisted;
  let masteredQuestions = [...prev.masteredQuestions];
  if (independent && !masteredQuestions.includes(a.questionId))
    masteredQuestions.push(a.questionId);
  if (!a.correct) masteredQuestions = masteredQuestions.filter((id) => id !== a.questionId);
  const interval = independent ? Math.min(30, Math.max(1, prev.interval * 2)) : 0;
  // A correct answer to a different theory question must not hide an unresolved
  // misconception. Keep the lesson due until each previously missed/guided check
  // has a later independent answer. SQL retains its existing scheduling rules.
  const latestTheoryAnswers = new Map<string, Attempt>();
  if (theoryQuestionById[a.questionId]) {
    for (const attempt of [...p.attempts, a]) {
      if (attempt.topicId === a.topicId) latestTheoryAnswers.set(attempt.questionId, attempt);
    }
  }
  const needsReview = latestTheoryAnswers.size
    ? [...latestTheoryAnswers.values()].some((attempt) => !attempt.correct || attempt.assisted)
    : !independent;
  return {
    ...p,
    attempts: [...p.attempts, a],
    topics: {
      ...p.topics,
      [a.topicId]: {
        masteredQuestions,
        needsReview,
        interval,
        dueAt: a.at + (independent && !needsReview ? interval * DAY : 0),
      },
    },
  };
}
export function nextQuestion(
  p: Progress,
  excluded: string[] = [],
  focus?: string,
  now = Date.now(),
): Question {
  const pool = focus ? questions.filter((q) => q.topic === focus) : questions;
  const available = pool.filter((q) => !excluded.includes(q.id));
  const candidates = available.length ? available : pool;
  const last = p.attempts.filter((a) => !theoryQuestionById[a.questionId]).at(-1);
  const score = (q: Question) => {
    const t = topicProgress(p, q.topic);
    const attempted = p.attempts.filter((a) => a.questionId === q.id);
    const index = topics.findIndex((t) => t.id === q.topic);
    let value = -index * 20;
    if (t.needsReview) value += 2000;
    else if (t.dueAt > 0 && t.dueAt <= now) value += 1400;
    else if (mastery(p, q.topic) === 100) value -= 3000;
    if (!t.masteredQuestions.includes(q.id)) value += 500;
    if (!attempted.length) value += 100;
    if (q.id === last?.questionId) value -= 250;
    return value;
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0];
}
export function localDay(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
export function streak(p: Progress, now = Date.now()): number {
  const days = new Set(p.attempts.map((a) => localDay(a.at)));
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  if (!days.has(localDay(d.getTime()))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (days.has(localDay(d.getTime()))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
export function todayAttempts(p: Progress): Attempt[] {
  return p.attempts.filter((a) => localDay(a.at) === localDay(Date.now()));
}
export function dueTopics(p: Progress): string[] {
  return topics
    .filter((t) => {
      const s = topicProgress(p, t.id);
      return s.needsReview || (s.dueAt > 0 && s.dueAt <= Date.now());
    })
    .map((t) => t.id);
}
