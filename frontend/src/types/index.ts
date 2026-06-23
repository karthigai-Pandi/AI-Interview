export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  profile?: CandidateProfile;
  createdAt?: string;
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
}

export interface Experience {
  company: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  experienceLevel: string;
  status: string;
  companyInfo?: { name: string; website?: string; location?: string };
  interviewConfig?: {
    aptitudeEnabled: boolean;
    technicalEnabled: boolean;
    aiInterviewEnabled: boolean;
  };
  hasApplied?: boolean;
}

export interface Application {
  _id: string;
  candidateId: string;
  jobId: Job | string;
  status: string;
  currentStage: string;
  resumeUrl?: string;
  scheduledInterviewAt?: string;
  interviewType?: 'phone' | 'video' | 'onsite' | 'ai';
  interviewNotes?: string;
  appliedAt: string;
}

export interface ResumeReport {
  _id: string;
  type: string;
  data: {
    skills: string[];
    atsScore: number;
    jobMatchScore?: number;
    matchedSkills: string[];
    missingSkills: string[];
    improvements: string[];
    recruiterSummary: string;
  };
}

export interface AssessmentQuestion {
  id: string;
  type?: string;
  question: string;
  options?: string[];
  language?: string;
  starterCode?: string;
  difficulty?: string;
  category?: string;
}

export interface InterviewSession {
  sessionId?: string;
  interviewId?: string;
  timeLimitMinutes: number;
  questions: AssessmentQuestion[];
  question?: string;
  questionNumber?: number;
}

export interface ConversationMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp?: string;
}

export interface EvaluationResult {
  overallScore: number;
  sectionScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recruiterSummary: string;
}

export interface DashboardStats {
  totalApplications?: number;
  activeApplications?: number;
  completedInterviews?: number;
  avgScore?: number;
  totalJobs?: number;
  activeJobs?: number;
  pendingReview?: number;
  shortlisted?: number;
  users?: number;
  jobs?: number;
  applications?: number;
  questions?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}
