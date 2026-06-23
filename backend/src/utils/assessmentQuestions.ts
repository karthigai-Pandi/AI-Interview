import { Types } from 'mongoose';
import { Question, IQuestion } from '../models/Question';

export function resolveJobId(jobId: unknown): Types.ObjectId | undefined {
  if (!jobId) return undefined;
  if (jobId instanceof Types.ObjectId) return jobId;
  if (typeof jobId === 'object' && jobId !== null && '_id' in jobId) {
    return (jobId as { _id: Types.ObjectId })._id;
  }
  return jobId as Types.ObjectId;
}

const FALLBACK_APTITUDE: Array<{
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
}> = [
  { category: 'aptitude', question: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctAnswer: '30', difficulty: 'medium' },
  { category: 'aptitude', question: 'A train travels 120 km in 2 hours. What is its speed?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], correctAnswer: '60 km/h', difficulty: 'medium' },
  { category: 'logical_reasoning', question: 'Complete the series: 2, 6, 12, 20, ?', options: ['28', '30', '32', '24'], correctAnswer: '30', difficulty: 'medium' },
  { category: 'quantitative', question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctAnswer: '12', difficulty: 'medium' },
  { category: 'quantitative', question: 'If x + 5 = 15, what is x?', options: ['5', '10', '15', '20'], correctAnswer: '10', difficulty: 'medium' },
  { category: 'verbal_ability', question: 'Choose the synonym of "Abundant":', options: ['Scarce', 'Plentiful', 'Limited', 'Rare'], correctAnswer: 'Plentiful', difficulty: 'medium' },
  { category: 'verbal_ability', question: 'Which word is spelled correctly?', options: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], correctAnswer: 'Accommodate', difficulty: 'medium' },
  { category: 'aptitude', question: 'If 20% of a number is 40, what is the number?', options: ['100', '200', '400', '800'], correctAnswer: '200', difficulty: 'medium' },
  { category: 'logical_reasoning', question: 'If all roses are flowers, which is necessarily true?', options: ['All flowers are roses', 'Some flowers are roses', 'No flowers are roses', 'Roses are not flowers'], correctAnswer: 'Some flowers are roses', difficulty: 'medium' },
  { category: 'quantitative', question: 'What is 25 × 4?', options: ['90', '100', '110', '120'], correctAnswer: '100', difficulty: 'medium' },
];

const FALLBACK_MCQ = [
  { type: 'mcq', question: 'What does REST stand for?', options: ['Representational State Transfer', 'Remote State Transfer', 'Relational State Transfer', 'Rapid State Transfer'], correctAnswer: 'Representational State Transfer', difficulty: 'medium' },
  { type: 'mcq', question: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctAnswer: 'Stack', difficulty: 'medium' },
  { type: 'mcq', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', difficulty: 'medium' },
];

const FALLBACK_CODING = [
  {
    type: 'coding',
    question: 'Write a function to return the sum of two numbers.',
    language: 'python',
    starterCode: 'def sum_numbers(a, b):\n    return a + b',
    testCases: [{ input: '2\n3', expectedOutput: '5', isHidden: false }],
    difficulty: 'medium',
  },
  {
    type: 'coding',
    question: 'Write a function to reverse a string.',
    language: 'javascript',
    starterCode: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
    testCases: [{ input: 'hello', expectedOutput: 'olleh', isHidden: false }],
    difficulty: 'medium',
  },
];

function uniqueQuestions(questions: IQuestion[]): IQuestion[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const id = q._id.toString();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export async function fetchAptitudeQuestions(
  category: string,
  difficulty: string,
  count: number
): Promise<IQuestion[]> {
  const queries = [
    { type: 'aptitude', category, difficulty, isActive: true },
    { type: 'aptitude', difficulty, isActive: true },
    { type: 'aptitude', isActive: true },
  ];

  let collected: IQuestion[] = [];
  for (const filter of queries) {
    if (collected.length >= count) break;
    const more = await Question.find(filter).limit(count - collected.length);
    collected = uniqueQuestions([...collected, ...more]);
  }

  if (collected.length < count) {
    for (const fb of FALLBACK_APTITUDE) {
      if (collected.length >= count) break;
      const exists = collected.some((q) => q.question === fb.question);
      if (exists) continue;
      const q = await Question.create({
        type: 'aptitude',
        isActive: true,
        tags: ['fallback'],
        ...fb,
      });
      collected.push(q);
    }
  }

  return collected.slice(0, count);
}

export async function fetchTechnicalQuestions(difficulty: string): Promise<IQuestion[]> {
  const mcqQueries = [
    { type: 'mcq', difficulty, isActive: true },
    { type: 'mcq', isActive: true },
  ];
  const codingQueries = [
    { type: { $in: ['coding', 'sql', 'debugging'] }, difficulty, isActive: true },
    { type: { $in: ['coding', 'sql', 'debugging'] }, isActive: true },
  ];

  let mcqQuestions: IQuestion[] = [];
  for (const filter of mcqQueries) {
    if (mcqQuestions.length >= 5) break;
    const more = await Question.find(filter).limit(5 - mcqQuestions.length);
    mcqQuestions = uniqueQuestions([...mcqQuestions, ...more]);
  }

  let codingQuestions: IQuestion[] = [];
  for (const filter of codingQueries) {
    if (codingQuestions.length >= 3) break;
    const more = await Question.find(filter).limit(3 - codingQuestions.length);
    codingQuestions = uniqueQuestions([...codingQuestions, ...more]);
  }

  if (mcqQuestions.length === 0) {
    for (const fb of FALLBACK_MCQ) {
      const q = await Question.create({ isActive: true, tags: ['fallback'], ...fb });
      mcqQuestions.push(q);
    }
  }

  if (codingQuestions.length === 0) {
    for (const fb of FALLBACK_CODING) {
      const q = await Question.create({ isActive: true, tags: ['fallback'], ...fb });
      codingQuestions.push(q);
    }
  }

  return [...mcqQuestions.slice(0, 5), ...codingQuestions.slice(0, 3)];
}

export function formatQuestionsForClient(questions: IQuestion[]) {
  return questions.map((q) => ({
    id: q._id.toString(),
    type: q.type,
    question: q.question,
    options: q.options,
    language: q.language,
    starterCode: q.starterCode,
    category: q.category,
    difficulty: q.difficulty,
  }));
}
