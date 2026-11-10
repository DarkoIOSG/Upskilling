export interface TheoryCheck {
  id: string;
  lessonId: string;
  prompt: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
}

export interface TheoryLesson {
  id: string;
  title: string;
  module:
    | 'Design foundations'
    | 'Modelling and normalization'
    | 'SQL and applied design'
    | 'Inside the database'
    | 'Transactions and operations';
  readings: string[];
  objectives: string[];
  body: string;
  simple: string;
  example: string;
  steps: [string, string, string];
  pitfall: string;
  checks: TheoryCheck[];
}

export interface TheoryReading {
  id: string;
  book: 'design' | 'architecture';
  label: string;
  url: string;
}

export type CheckInput = [
  prompt: string,
  options: [string, string, string],
  answer: number,
  explanation: string,
];

export function defineLesson(
  id: string,
  title: string,
  module: TheoryLesson['module'],
  readings: string[],
  objectives: string[],
  body: string,
  simple: string,
  example: string,
  steps: TheoryLesson['steps'],
  pitfall: string,
  checks: [CheckInput, CheckInput, CheckInput],
): TheoryLesson {
  return {
    id: `db-${id}`,
    title,
    module,
    readings,
    objectives,
    body,
    simple,
    example,
    steps,
    pitfall,
    checks: checks.map(([prompt, options, answer, explanation], i) => ({
      id: `db-${id}-${i + 1}`,
      lessonId: `db-${id}`,
      prompt,
      options,
      answer,
      explanation,
    })),
  };
}
