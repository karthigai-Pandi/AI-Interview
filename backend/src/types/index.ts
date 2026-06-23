export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

export interface Experience {
  company: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface CandidateProfile {
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  portfolioLinks: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  resumePublicId?: string;
}

export interface InterviewConfig {
  aptitudeEnabled: boolean;
  technicalEnabled: boolean;
  aiInterviewEnabled: boolean;
}

export interface SectionScores {
  technical: number;
  communication: number;
  problemSolving: number;
  aptitude: number;
  confidence: number;
  grammar: number;
  fluency: number;
  relevance: number;
}

export interface AntiCheatFlags {
  tabSwitches: number;
  pasteEvents: number;
  fullscreenExits: number;
}

export interface InterviewQuestion {
  questionId: string;
  questionText: string;
  answer?: string;
  code?: string;
  score?: number;
  timeSpent?: number;
  isCorrect?: boolean;
}

export interface ConversationMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}
