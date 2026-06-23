import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  aiModel: string;
  aiTemperature: number;
  proctoringEnabled: boolean;
  faceAnalysisEnabled: boolean;
  maxInterviewQuestions: number;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    aiModel: { type: String, default: 'gpt-4o-mini' },
    aiTemperature: { type: Number, default: 0.7, min: 0, max: 2 },
    proctoringEnabled: { type: Boolean, default: true },
    faceAnalysisEnabled: { type: Boolean, default: true },
    maxInterviewQuestions: { type: Number, default: 8, min: 3, max: 20 },
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

export async function getSystemSettings(): Promise<ISystemSettings> {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }
  return settings;
}
