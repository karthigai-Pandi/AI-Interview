import mongoose, { Schema, Document, Types } from 'mongoose';

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'assessment'
  | 'interview'
  | 'shortlisted'
  | 'rejected';

export interface IApplication extends Document {
  _id: Types.ObjectId;
  candidateId: Types.ObjectId;
  jobId: Types.ObjectId;
  status: ApplicationStatus;
  resumeUrl?: string;
  resumeAnalysisId?: Types.ObjectId;
  currentStage: string;
  scheduledInterviewAt?: Date;
  interviewType?: 'phone' | 'video' | 'onsite' | 'ai';
  interviewNotes?: string;
  appliedAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    status: {
      type: String,
      enum: ['applied', 'screening', 'assessment', 'interview', 'shortlisted', 'rejected'],
      default: 'applied',
    },
    resumeUrl: String,
    resumeAnalysisId: { type: Schema.Types.ObjectId, ref: 'Report' },
    currentStage: { type: String, default: 'Application Submitted' },
    scheduledInterviewAt: Date,
    interviewType: { type: String, enum: ['phone', 'video', 'onsite', 'ai'] },
    interviewNotes: String,
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
