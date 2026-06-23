export const aptitudeQuestions = [
  { category: 'aptitude', question: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctAnswer: '30', difficulty: 'easy' },
  { category: 'aptitude', question: 'A train travels 120 km in 2 hours. What is its speed?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], correctAnswer: '60 km/h', difficulty: 'easy' },
  { category: 'logical_reasoning', question: 'If all roses are flowers and some flowers fade quickly, which is true?', options: ['All roses fade quickly', 'Some roses may fade quickly', 'No roses fade', 'Roses never fade'], correctAnswer: 'Some roses may fade quickly', difficulty: 'medium' },
  { category: 'logical_reasoning', question: 'Complete the series: 2, 6, 12, 20, ?', options: ['28', '30', '32', '24'], correctAnswer: '30', difficulty: 'medium' },
  { category: 'quantitative', question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], correctAnswer: '12', difficulty: 'easy' },
  { category: 'quantitative', question: 'If x + 5 = 15, what is x?', options: ['5', '10', '15', '20'], correctAnswer: '10', difficulty: 'easy' },
  { category: 'verbal_ability', question: 'Choose the synonym of "Abundant":', options: ['Scarce', 'Plentiful', 'Limited', 'Rare'], correctAnswer: 'Plentiful', difficulty: 'easy' },
  { category: 'verbal_ability', question: 'Which word is spelled correctly?', options: ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], correctAnswer: 'Accommodate', difficulty: 'medium' },
];

export const technicalQuestions = [
  {
    type: 'mcq',
    question: 'What does REST stand for?',
    options: ['Representational State Transfer', 'Remote State Transfer', 'Relational State Transfer', 'Rapid State Transfer'],
    correctAnswer: 'Representational State Transfer',
    difficulty: 'easy',
    tags: ['web'],
  },
  {
    type: 'mcq',
    question: 'Which data structure uses LIFO?',
    options: ['Queue', 'Stack', 'Linked List', 'Tree'],
    correctAnswer: 'Stack',
    difficulty: 'easy',
    tags: ['dsa'],
  },
  {
    type: 'coding',
    question: 'Write a function to return the sum of two numbers.',
    language: 'python',
    starterCode: 'def sum_numbers(a, b):\n    # Your code here\n    pass',
    testCases: [
      { input: '2\n3', expectedOutput: '5', isHidden: false },
      { input: '10\n20', expectedOutput: '30', isHidden: true },
    ],
    difficulty: 'easy',
    tags: ['python'],
  },
  {
    type: 'coding',
    question: 'Write a function to reverse a string in JavaScript.',
    language: 'javascript',
    starterCode: 'function reverseString(str) {\n  // Your code here\n}',
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'world', expectedOutput: 'dlrow', isHidden: true },
    ],
    difficulty: 'medium',
    tags: ['javascript'],
  },
  {
    type: 'sql',
    question: 'Write a SQL query to select all employees with salary > 50000.',
    language: 'sql',
    starterCode: '-- SELECT ... FROM employees WHERE ...',
    testCases: [{ input: '', expectedOutput: 'SELECT', isHidden: false }],
    difficulty: 'medium',
    tags: ['sql'],
  },
];
