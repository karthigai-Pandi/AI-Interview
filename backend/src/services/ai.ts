import axios from 'axios';
import { config } from '../config';

const aiClient = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

export interface ResumeAnalyzeRequest {
  resume_url: string;
  job_description?: string;
  job_skills?: string[];
}

export interface ResumeAnalyzeResponse {
  skills: string[];
  ats_score: number;
  job_match_score?: number;
  matched_skills: string[];
  missing_skills: string[];
  improvements: string[];
  recruiter_summary: string;
  extracted_text?: string;
  experience_years?: number;
}

export interface GenerateQuestionsRequest {
  type: string;
  category?: string;
  difficulty: string;
  count: number;
  job_description?: string;
}

export interface GeneratedQuestion {
  question: string;
  options?: string[];
  correct_answer?: string;
  category?: string;
  difficulty?: string;
}

export interface InterviewMessageRequest {
  conversation: Array<{ role: string; content: string }>;
  job_description?: string;
  company_name?: string;
  interview_type?: string;
  question_count?: number;
}

export interface InterviewMessageResponse {
  question: string;
  is_complete: boolean;
  question_number: number;
}

export interface EvaluateInterviewRequest {
  conversation: Array<{ role: string; content: string }>;
  job_description?: string;
  interview_type?: string;
}

export interface EvaluateInterviewResponse {
  section_scores: {
    technical: number;
    communication: number;
    problem_solving: number;
    confidence: number;
    grammar: number;
    fluency: number;
    relevance: number;
  };
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recruiter_summary: string;
}

export const aiService = {
  async extractResume(resumeUrl: string): Promise<{ text: string }> {
    const { data } = await aiClient.post('/resume/extract', { resume_url: resumeUrl });
    return data;
  },

  async analyzeResume(payload: ResumeAnalyzeRequest): Promise<ResumeAnalyzeResponse> {
    const { data } = await aiClient.post('/resume/analyze', payload);
    return data;
  },

  async generateQuestions(payload: GenerateQuestionsRequest): Promise<GeneratedQuestion[]> {
    const { data } = await aiClient.post('/questions/generate', payload);
    return data.questions;
  },

  async getNextInterviewQuestion(
    payload: InterviewMessageRequest
  ): Promise<InterviewMessageResponse> {
    const { data } = await aiClient.post('/interview/next-question', payload);
    return data;
  },

  async evaluateInterview(payload: EvaluateInterviewRequest): Promise<EvaluateInterviewResponse> {
    const { data } = await aiClient.post('/interview/evaluate', payload);
    return data;
  },

  async evaluateCode(
    language: string,
    code: string,
    testCases: Array<{ input: string; expected_output: string }>
  ): Promise<{ score: number; results: Array<{ passed: boolean }> }> {
    const { data } = await aiClient.post('/code/evaluate', {
      language,
      code,
      test_cases: testCases,
    });
    return data;
  },

  async analyzeProctoring(imageBase64?: string) {
    const { data } = await aiClient.post('/proctoring/analyze', {
      image_base64: imageBase64,
    });
    return data;
  },
};
