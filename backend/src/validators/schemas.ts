import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['candidate', 'recruiter']).default('candidate'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        description: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        current: z.boolean().default(false),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        startYear: z.number(),
        endYear: z.number().optional(),
      })
    )
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        date: z.string(),
        url: z.string().optional(),
      })
    )
    .optional(),
  portfolioLinks: z.array(z.string().url()).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
});

export const jobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  skills: z.array(z.string()).default([]),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).default('mid'),
  status: z.enum(['draft', 'active', 'closed']).default('draft'),
  companyInfo: z
    .object({
      name: z.string(),
      website: z.string().optional(),
      location: z.string().optional(),
    })
    .optional(),
  interviewConfig: z
    .object({
      aptitudeEnabled: z.boolean().default(true),
      technicalEnabled: z.boolean().default(true),
      aiInterviewEnabled: z.boolean().default(true),
    })
    .optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(['applied', 'screening', 'assessment', 'interview', 'shortlisted', 'rejected']),
  currentStage: z.string().optional(),
});

export const questionSchema = z.object({
  type: z.enum(['aptitude', 'mcq', 'coding', 'sql', 'debugging']),
  category: z
    .enum(['aptitude', 'logical_reasoning', 'quantitative', 'verbal_ability'])
    .optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  question: z.string().min(5),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
      })
    )
    .optional(),
  language: z.string().optional(),
  starterCode: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const aptitudeStartSchema = z.object({
  applicationId: z.string(),
  category: z
    .enum(['aptitude', 'logical_reasoning', 'quantitative', 'verbal_ability'])
    .default('aptitude'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().min(5).max(20).default(10),
});

export const technicalStartSchema = z.object({
  applicationId: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export const submitAnswerSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string().optional(),
      code: z.string().optional(),
      timeSpent: z.number().optional(),
    })
  ),
  antiCheatFlags: z
    .object({
      tabSwitches: z.number().default(0),
      pasteEvents: z.number().default(0),
      fullscreenExits: z.number().default(0),
    })
    .optional(),
});

export const runCodeSchema = z.object({
  language: z.string(),
  code: z.string(),
  stdin: z.string().optional(),
});

export const aiInterviewStartSchema = z.object({
  applicationId: z.string(),
});

export const aiMessageSchema = z.object({
  message: z.string().min(1),
});

export const resumeAnalyzeSchema = z.object({
  resumeUrl: z.string().optional(),
  jobId: z.string().optional(),
});

export const applyJobSchema = z.object({
  jobId: z.string(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  jobId: z.string().optional(),
});

export const roleUpdateSchema = z.object({
  role: z.enum(['admin', 'recruiter', 'candidate']),
});

export const scheduleInterviewSchema = z.object({
  scheduledInterviewAt: z.string().datetime(),
  interviewType: z.enum(['phone', 'video', 'onsite', 'ai']).default('video'),
  interviewNotes: z.string().optional(),
});

export const systemSettingsSchema = z.object({
  aiModel: z.string().min(1).optional(),
  aiTemperature: z.number().min(0).max(2).optional(),
  proctoringEnabled: z.boolean().optional(),
  faceAnalysisEnabled: z.boolean().optional(),
  maxInterviewQuestions: z.number().min(3).max(20).optional(),
});
