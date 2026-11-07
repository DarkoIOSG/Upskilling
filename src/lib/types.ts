export type Level = 'Foundations' | 'Intermediate' | 'Advanced' | 'Interview';
export interface Topic {
  id: string;
  title: string;
  description: string;
  level: Level;
  lesson: string;
  example: string;
  takeaway: string;
}
interface BaseQuestion {
  id: string;
  topic: string;
  title: string;
  prompt: string;
  hint: string;
  explanation: string;
}
export interface SqlQuestion extends BaseQuestion {
  type: 'sql';
  solution: string;
  starter: string;
  ordered?: boolean;
}
export interface ChoiceQuestion extends BaseQuestion {
  type: 'choice';
  options: string[];
  answer: number;
}
export type Question = SqlQuestion | ChoiceQuestion;
export interface Attempt {
  questionId: string;
  topicId: string;
  correct: boolean;
  assisted: boolean;
  at: number;
}
export interface TopicProgress {
  masteredQuestions: string[];
  needsReview: boolean;
  dueAt: number;
  interval: number;
}
export interface Progress {
  version: 1;
  attempts: Attempt[];
  topics: Record<string, TopicProgress>;
  dailyGoal: number;
}
export interface QueryResult {
  columns: string[];
  values: (string | number | null)[][];
}
export interface Evaluation {
  correct: boolean;
  actual?: QueryResult;
  expected?: QueryResult;
  error?: string;
  hiddenFailure?: boolean;
}
