import type { TheoryReading } from '../lib/theory-types';

export const theoryBooks = [
  {
    id: 'design',
    title: 'Database Design, 2nd Edition',
    authors: 'Adrienne Watt and Nelson Eng · BCcampus · 2014',
    url: 'https://opentextbc.ca/dbdesign01/',
    description:
      'An openly licensed introductory textbook. Our study guide maps all 16 chapters and the three applied appendices into lessons and original questions.',
    license:
      'CC BY 4.0, except where otherwise noted. Original explanations and exercises in this app adapt the topic structure; examples have been rewritten.',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    id: 'architecture',
    title: 'Architecture of a Database System',
    authors: 'Joseph M. Hellerstein, Michael Stonebraker and James Hamilton · 2007',
    url: 'https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf',
    description:
      'An author-hosted, freely readable systems monograph assigned by MIT. Our guide covers all eight major sections, from query processing to operations. Product examples in the original are historical.',
    license:
      'Free to read from the authors; copyright remains with the authors. The app links to the book and provides original teaching examples, rather than redistributing it.',
    licenseUrl: 'https://ocw.mit.edu/courses/6-830-database-systems-fall-2010/pages/readings/lec4/',
  },
] as const;

const designUnits: [string, string, string][] = [
  ['1', 'Before database systems', 'chapter/chapter-1-before-the-advent-of-database-systems/'],
  ['2', 'Fundamental concepts', 'chapter/chapter-2-fundamental-concepts/'],
  [
    '3',
    'Characteristics and benefits',
    'chapter/chapter-3-characteristics-and-benefits-of-a-database/',
  ],
  ['4', 'Types of data models', 'chapter/chapter-4-types-of-database-models/'],
  ['5', 'Data modelling', 'chapter/chapter-5-data-modelling/'],
  ['6', 'Classification of DBMSs', 'chapter/chapter-6-classification-of-database-systems/'],
  ['7', 'The relational data model', 'chapter/chapter-7-the-relational-data-model/'],
  ['8', 'The entity relationship model', 'chapter/chapter-8-entity-relationship-model/'],
  ['9', 'Integrity rules and constraints', 'chapter/chapter-9-integrity-rules-and-constraints/'],
  ['10', 'ER modelling', 'chapter/chapter-10-er-modelling/'],
  ['11', 'Functional dependencies', 'chapter/chapter-11-functional-dependencies/'],
  ['12', 'Normalization', 'chapter/chapter-12-normalization/'],
  ['13', 'Database development process', 'chapter/chapter-13-database-development-process/'],
  ['14', 'Database users', 'chapter/chapter-14-database-users/'],
  ['15', 'SQL: structure and definition', 'chapter/sql-structured-query-language/'],
  ['16', 'SQL: data manipulation', 'chapter/chapter-sql-dml/'],
  [
    'A',
    'University registration model',
    'back-matter/appendix-a-university-registration-data-model-example/',
  ],
  ['B', 'ER diagram exercises', 'back-matter/appendix-b-erd-exercises/'],
  ['C', 'SQL lab', 'back-matter/appendix-d-sql-lab-with-solution/'],
];

// PDF page numbers include the cover. Source sections, not product-specific guarantees.
const architectureUnits: [string, string, number][] = [
  ['1', 'Introduction and the life of a query', 2],
  ['2', 'Process models', 9],
  ['3', 'Parallel architecture', 25],
  ['4', 'Relational query processor', 36],
  ['5', 'Storage management', 70],
  ['6', 'Transactions: concurrency control and recovery', 78],
  ['7', 'Shared components', 100],
  ['8', 'Conclusion', 111],
];

export const theoryReadings: TheoryReading[] = [
  ...designUnits.map(([id, title, path]): TheoryReading => ({
    id: `design:${id}`,
    book: 'design',
    label: `${/^[A-C]$/.test(id) ? 'Appendix' : 'Chapter'} ${id} · ${title}`,
    url: `https://opentextbc.ca/dbdesign01/${path}`,
  })),
  ...architectureUnits.map(([id, title, page]): TheoryReading => ({
    id: `architecture:${id}`,
    book: 'architecture',
    label: `Section ${id} · ${title}`,
    url: `https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf#page=${page}`,
  })),
];
export const theoryReadingById = Object.fromEntries(theoryReadings.map((r) => [r.id, r]));
