import axios from 'axios';
import { config } from '../config';

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  sql: 'sqlite3',
};

export interface PistonResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
  };
}

export async function executeCode(
  language: string,
  code: string,
  stdin = ''
): Promise<PistonResult> {
  const pistonLang = LANGUAGE_MAP[language] || language;

  const response = await axios.post(`${config.pistonApiUrl}/execute`, {
    language: pistonLang,
    version: '*',
    files: [{ name: 'main', content: code }],
    stdin,
  });

  return response.data;
}

export async function runTestCases(
  language: string,
  code: string,
  testCases: Array<{ input: string; expectedOutput: string }>
): Promise<Array<{ passed: boolean; input: string; expected: string; actual: string }>> {
  const results = [];

  for (const tc of testCases) {
    const result = await executeCode(language, code, tc.input);
    const actual = result.run.stdout.trim();
    const expected = tc.expectedOutput.trim();
    results.push({
      passed: actual === expected && result.run.code === 0,
      input: tc.input,
      expected,
      actual,
    });
  }

  return results;
}
