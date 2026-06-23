import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReportType = 'resume_analysis' | 'interview_evaluation';

export interface ResumeAnalysisData {
  extractedText?: string;
  skills: string[];
  atsScore: number;
  jobMatchScore?: number;
  matchedSkills: string[];
  missingSkills: string[];
  improvements: string[];
  recruiterSummary: string;
  experienceYears?: number;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  type: ReportType;
  candidateId: Types.ObjectId;
  jobId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
  data: ResumeAnalysisData | Record<string, unknown>;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    type: { type: String, enum: ['resume_analysis', 'interview_evaluation'], required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

reportSchema.index({ candidateId: 1 });
reportSchema.index({ applicationId: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
