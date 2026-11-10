import { describe, expect, it } from 'vitest';
import { theoryLessons, theoryQuestions, theoryLessonById } from '../src/data/theory';
import { theoryReadings } from '../src/data/theory-sources';
import { questions, topics } from '../src/data/curriculum';
import {
  emptyProgress,
  nextQuestion,
  parseProgress,
  recordAttempt,
  topicProgress,
} from '../src/lib/progress';
import { nextTheoryQuestion, theoryDue, theoryMastery } from '../src/lib/theory-progress';
import type { Attempt, Progress } from '../src/lib/types';

const now = new Date('2026-11-10T12:00:00Z').getTime();
const attempt = (id: string, overrides: Partial<Attempt> = {}): Attempt => ({
  questionId: id,
  topicId: theoryQuestions.find((q) => q.id === id)!.lessonId,
  correct: true,
  assisted: false,
  at: now,
  ...overrides,
});
const answer = (p: Progress, id: string, overrides: Partial<Attempt> = {}) =>
  recordAttempt(p, attempt(id, overrides));

describe('theory curriculum and verified source coverage', () => {
  it('maps all 16 design chapters, three appendices, and eight architecture sections to actual lessons', () => {
    const required = [
      ...Array.from({ length: 16 }, (_, i) => `design:${i + 1}`),
      'design:A',
      'design:B',
      'design:C',
      ...Array.from({ length: 8 }, (_, i) => `architecture:${i + 1}`),
    ];
    expect(theoryReadings.map((r) => r.id).sort()).toEqual(required.sort());
    expect([...new Set(theoryLessons.flatMap((l) => l.readings))].sort()).toEqual(required.sort());
    for (const reading of theoryReadings) expect(new URL(reading.url).protocol).toBe('https:');
  });
  it('has usable independent questions and distinct explanation modes for every lesson', () => {
    expect(theoryLessons).toHaveLength(40);
    expect(theoryQuestions).toHaveLength(120);
    for (const lesson of theoryLessons) {
      expect(lesson.checks).toHaveLength(3);
      expect(lesson.body.length).toBeGreaterThan(300);
      expect(new Set([lesson.simple, lesson.example, lesson.steps.join(' ')])).toHaveLength(3);
      for (const q of lesson.checks) {
        expect(q.lessonId).toBe(lesson.id);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.options[q.answer]).toBeTruthy();
        expect(new Set(q.options).size).toBe(3);
        expect(q.explanation.length).toBeGreaterThan(50);
      }
    }
  });
  it('does not collide with stable SQL topic or question identities', () => {
    const lessonIds = [...topics, ...theoryLessons].map((t) => t.id);
    const questionIds = [...questions, ...theoryQuestions].map((q) => q.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    expect(new Set(questionIds).size).toBe(questionIds.length);
  });
});

describe('retention and remediation', () => {
  it('begins at foundations and selects a different question after a misconception', () => {
    const p = answer(emptyProgress(), 'db-files-1', { correct: false });
    expect(nextTheoryQuestion(emptyProgress(), [], undefined, now).id).toBe('db-files-1');
    const next = nextTheoryQuestion(p, ['db-files-1'], undefined, now);
    expect(next.lessonId).toBe('db-files');
    expect(next.id).not.toBe('db-files-1');
  });
  it('prioritizes an advanced gap ahead of unstarted foundational lessons', () => {
    const p = answer(emptyProgress(), 'db-recovery-1', { correct: false });
    expect(nextTheoryQuestion(p, ['db-recovery-1'], undefined, now).lessonId).toBe('db-recovery');
  });
  it('keeps a missed question due after another question succeeds independently', () => {
    let p = answer(emptyProgress(), 'db-files-1', { correct: false });
    p = answer(p, 'db-files-2');
    expect(topicProgress(p, 'db-files').needsReview).toBe(true);
    expect(theoryDue(p, now)).toContain('db-files');
    p = answer(p, 'db-files-1');
    expect(topicProgress(p, 'db-files').needsReview).toBe(false);
  });
  it('does not grant mastery to assisted answers or repeated evidence for one check', () => {
    let p = answer(emptyProgress(), 'db-files-1', { assisted: true });
    expect(theoryMastery(p, 'db-files')).toBe(0);
    expect(theoryDue(p, now)).toContain('db-files');
    p = answer(p, 'db-files-1');
    p = answer(p, 'db-files-1');
    expect(theoryMastery(p, 'db-files')).toBe(33);
    p = answer(p, 'db-files-2');
    p = answer(p, 'db-files-3');
    expect(theoryMastery(p, 'db-files')).toBe(100);
  });
  it('removes old mastery evidence after an incorrect review', () => {
    let p = emptyProgress();
    for (const q of theoryLessonById['db-files'].checks) p = answer(p, q.id);
    expect(theoryMastery(p, 'db-files')).toBe(100);
    p = answer(p, 'db-files-2', { correct: false });
    expect(theoryMastery(p, 'db-files')).toBe(67);
    expect(nextTheoryQuestion(p, [], undefined, now).lessonId).toBe('db-files');
  });
  it('respects review dates and the 30-day maximum interval', () => {
    let p = emptyProgress();
    for (const q of theoryLessonById['db-files'].checks) p = answer(p, q.id);
    const dueAt = topicProgress(p, 'db-files').dueAt;
    expect(theoryDue(p, dueAt - 1)).not.toContain('db-files');
    expect(theoryDue(p, dueAt)).toContain('db-files');
    for (let i = 0; i < 10; i++) p = answer(p, 'db-files-1');
    expect(topicProgress(p, 'db-files').interval).toBe(30);
  });
  it('keeps focused questions in the chosen lesson and excludes seen questions', () => {
    const focus = 'db-recovery';
    const selected: string[] = [];
    for (let i = 0; i < 3; i++)
      selected.push(nextTheoryQuestion(emptyProgress(), selected, focus, now).id);
    expect(new Set(selected).size).toBe(3);
    expect(selected.every((id) => theoryLessonById[focus].checks.some((q) => q.id === id))).toBe(
      true,
    );
  });
  it('keeps SQL practice isolated from theory gaps', () => {
    const p = answer(emptyProgress(), 'db-files-1', { correct: false });
    expect(nextQuestion(p).id).toBe('select-1');
    expect(theoryMastery(emptyProgress(), 'missing')).toBe(0);
  });
});

describe('existing progress and shared backups', () => {
  it('roundtrips an existing SQL-only backup without migration or data loss', () => {
    const p = recordAttempt(emptyProgress(), {
      questionId: 'select-1',
      topicId: 'select',
      correct: true,
      assisted: false,
      at: now,
    });
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
  });
  it('roundtrips mixed progress and rejects cross-track or fabricated evidence', () => {
    const p = answer(emptyProgress(), 'db-files-1');
    expect(parseProgress(JSON.stringify(p))).toEqual(p);
    expect(() =>
      parseProgress(
        JSON.stringify({ ...p, attempts: [attempt('db-files-1', { topicId: 'select' })] }),
      ),
    ).toThrow();
    expect(() =>
      parseProgress(
        JSON.stringify({
          ...p,
          topics: { 'db-files': { ...p.topics['db-files'], masteredQuestions: ['select-1'] } },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseProgress(
        JSON.stringify({
          ...p,
          topics: { 'db-files': { ...p.topics['db-files'], masteredQuestions: ['db-fake-1'] } },
        }),
      ),
    ).toThrow();
  });
});
