import mongoose, { Schema, Document, Types } from 'mongoose';
import { InterviewConfig } from '../types';

export interface IJob extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  recruiterId: Types.ObjectId;
  status: 'draft' | 'active' | 'closed';
  companyInfo?: {
    name: string;
    website?: string;
    location?: string;
  };
  interviewConfig: InterviewConfig;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead'],
      default: 'mid',
    },
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
    companyInfo: {
      name: String,
      website: String,
      location: String,
    },
    interviewConfig: {
      aptitudeEnabled: { type: Boolean, default: true },
      technicalEnabled: { type: Boolean, default: true },
      aiInterviewEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

jobSchema.index({ recruiterId: 1 });
jobSchema.index({ status: 1 });

export const Job = mongoose.model<IJob>('Job', jobSchema);
