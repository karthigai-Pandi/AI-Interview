import mongoose, { Schema, Document, Types } from 'mongoose';
import { SectionScores } from '../types';

export interface IResult extends Document {
  _id: Types.ObjectId;
  interviewId: Types.ObjectId;
  applicationId: Types.ObjectId;
  candidateId: Types.ObjectId;
  sectionScores: SectionScores;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recruiterSummary: string;
  evaluatedAt: Date;
  createdAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sectionScores: {
      technical: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      aptitude: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      fluency: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
    },
    overallScore: { type: Number, default: 0 },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    recruiterSummary: { type: String, default: '' },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resultSchema.index({ applicationId: 1 });
resultSchema.index({ candidateId: 1 });

export const Result = mongoose.model<IResult>('Result', resultSchema);
