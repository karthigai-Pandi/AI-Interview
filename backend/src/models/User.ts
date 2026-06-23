import mongoose, { Schema, Document, Types } from 'mongoose';
import { CandidateProfile, UserRole } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  googleId?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatar?: string;
  profile?: CandidateProfile;
  createdAt: Date;
  updatedAt: Date;
}

const educationSchema = new Schema({
  institution: String,
  degree: String,
  field: String,
  startYear: Number,
  endYear: Number,
});

const experienceSchema = new Schema({
  company: String,
  title: String,
  description: String,
  startDate: String,
  endDate: String,
  current: { type: Boolean, default: false },
});

const certificationSchema = new Schema({
  name: String,
  issuer: String,
  date: String,
  url: String,
});

const profileSchema = new Schema({
  phone: String,
  location: String,
  bio: String,
  skills: { type: [String], default: [] },
  experience: { type: [experienceSchema], default: [] },
  education: { type: [educationSchema], default: [] },
  certifications: { type: [certificationSchema], default: [] },
  portfolioLinks: { type: [String], default: [] },
  githubUrl: String,
  linkedinUrl: String,
  resumeUrl: String,
  resumePublicId: String,
});

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'recruiter', 'candidate'], default: 'candidate' },
    googleId: { type: String, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: String,
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

export const User = mongoose.model<IUser>('User', userSchema);
