import { useId, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react';
import { lessons } from '../data/lessons';
import type { MiniLesson, Topic } from '../lib/types';

function UnderstandingQuiz({ lesson }: { lesson: MiniLesson }) {
  const id = useId();
  const [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  const [checked, setChecked] = useState([false, false]);
  const correct = lesson.checks.filter((q, i) => checked[i] && answers[i] === q.answer).length;
  return (
    <div className="understanding-quiz">
      <p className="lesson-intro">
        Try answering before looking back at the notes. These checks are for learning and do not
        change your practice progress.
      </p>
      <p className="check-summary" role="status">
        {correct} of {lesson.checks.length} checks correct
        {correct === lesson.checks.length ? ' · Ready to put it into practice.' : ''}
      </p>
      {lesson.checks.map((q, i) => (
        <div className="understanding-card" key={q.prompt}>
          <fieldset
            disabled={checked[i]}
            aria-describedby={checked[i] ? `${id}-feedback-${i}` : undefined}
          >
            <legend>
              <span className="eyebrow">QUESTION {i + 1}</span>
              {q.prompt}
            </legend>
            <div className="check-options">
              {q.options.map((option, index) => (
                <label
                  className={`check-option ${answers[i] === index ? 'chosen' : ''}`}
                  key={option}
                >
                  <input
                    type="radio"
                    name={`${id}-question-${i}`}
                    checked={answers[i] === index}
                    onChange={() =>
                      setAnswers((values) => values.map((value, j) => (j === i ? index : value)))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {!checked[i] ? (
            <button
              className="button secondary"
              aria-label={`Check understanding, question ${i + 1}`}
              disabled={answers[i] === null}
              onClick={() =>
                setChecked((values) => values.map((value, j) => (j === i ? true : value)))
              }
            >
              Check understanding
            </button>
          ) : (
            <>
              <div
                id={`${id}-feedback-${i}`}
                className={`check-feedback ${answers[i] === q.answer ? 'is-correct' : ''}`}
                role="status"
              >
                <strong>
                  {answers[i] === q.answer ? 'That’s right.' : 'A useful distinction.'}
                </strong>
                {answers[i] !== q.answer && <p>Correct answer: {q.options[q.answer]}</p>}
                <p>{q.explanation}</p>
              </div>
              <button
                className="text-button"
                aria-label={`Try question ${i + 1} again`}
                onClick={() => {
                  setAnswers((values) => values.map((value, j) => (j === i ? null : value)));
                  setChecked((values) => values.map((value, j) => (j === i ? false : value)));
                }}
              >
                <RotateCcw size={14} />
                Try again
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonContent({ topic }: { topic: Topic }) {
  const [section, setSection] = useState('lesson');
  const id = useId();
  const content = lessons[topic.id];
  return (
    <div className="lesson">
      <span className="eyebrow">{topic.level} · LEARN, REFLECT, PRACTICE</span>
      <div className="lesson-sections" role="group" aria-label="Lesson sections">
        {[
          ['lesson', 'Short lesson'],
          ['tips', 'Tips & tricks'],
          ['checks', `Quick check (${content.checks.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={section === key}
            aria-controls={`${id}-${key}`}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="lesson-panel" id={`${id}-lesson`} hidden={section !== 'lesson'}>
        <p>{topic.lesson}</p>
        <div className="mental-model">
          <strong>A way to think about it</strong>
          <p>{content.mentalModel}</p>
        </div>
        <pre>
          <code>{topic.example}</code>
        </pre>
        <div className="takeaway">
          <CheckCircle2 size={19} />
          <span>{topic.takeaway}</span>
        </div>
        <button className="text-button lesson-next" onClick={() => setSection('tips')}>
          Explore tips & tricks <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="lesson-panel" id={`${id}-tips`} hidden={section !== 'tips'}>
        <h3 className="lesson-section-heading">
          <Lightbulb size={18} />
          Tips you can use
        </h3>
        <ul className="lesson-tips">
          {content.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <div className="lesson-pitfall">
          <strong>Common mistake</strong>
          <p>{content.pitfall}</p>
        </div>
        <button className="text-button lesson-next" onClick={() => setSection('checks')}>
          Check your understanding <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="lesson-panel" id={`${id}-checks`} hidden={section !== 'checks'}>
        <UnderstandingQuiz lesson={content} />
      </div>
      <a className="lesson-reference" href={content.reference.url} target="_blank" rel="noreferrer">
        {content.reference.title}
        <ArrowUpRight size={13} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}

// Reset all lesson state when practice switches to a different concept.
export default function Lesson({ topic }: { topic: Topic }) {
  return <LessonContent key={topic.id} topic={topic} />;
}
