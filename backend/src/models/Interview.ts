import mongoose, { Schema, Document, Types } from 'mongoose';
import { AntiCheatFlags, ConversationMessage, InterviewQuestion } from '../types';

export type InterviewType = 'aptitude' | 'technical' | 'ai_hr';
export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface IInterview extends Document {
  _id: Types.ObjectId;
  applicationId: Types.ObjectId;
  candidateId: Types.ObjectId;
  jobId?: Types.ObjectId;
  type: InterviewType;
  status: InterviewStatus;
  questions: InterviewQuestion[];
  conversation: ConversationMessage[];
  category?: string;
  difficulty?: string;
  timeLimitMinutes?: number;
  score?: number;
  startedAt?: Date;
  completedAt?: Date;
  antiCheatFlags: AntiCheatFlags;
  createdAt: Date;
  updatedAt: Date;
}

const interviewQuestionSchema = new Schema({
  questionId: String,
  questionText: String,
  answer: String,
  code: String,
  score: Number,
  timeSpent: Number,
  isCorrect: Boolean,
});

const conversationSchema = new Schema({
  role: { type: String, enum: ['interviewer', 'candidate'] },
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const interviewSchema = new Schema<IInterview>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    type: { type: String, enum: ['aptitude', 'technical', 'ai_hr'], required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'expired'],
      default: 'pending',
    },
    questions: { type: [interviewQuestionSchema], default: [] },
    conversation: { type: [conversationSchema], default: [] },
    category: String,
    difficulty: String,
    timeLimitMinutes: Number,
    score: Number,
    startedAt: Date,
    completedAt: Date,
    antiCheatFlags: {
      tabSwitches: { type: Number, default: 0 },
      pasteEvents: { type: Number, default: 0 },
      fullscreenExits: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

interviewSchema.index({ applicationId: 1, type: 1 });
interviewSchema.index({ candidateId: 1 });

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);
