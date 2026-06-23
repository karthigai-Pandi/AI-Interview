import mongoose, { Schema, Document, Types } from 'mongoose';

export type QuestionType = 'aptitude' | 'mcq' | 'coding' | 'sql' | 'debugging';
export type QuestionCategory =
  | 'aptitude'
  | 'logical_reasoning'
  | 'quantitative'
  | 'verbal_ability';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  type: QuestionType;
  category?: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  options?: string[];
  correctAnswer?: string;
  testCases?: TestCase[];
  language?: string;
  starterCode?: string;
  tags: string[];
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema({
  input: String,
  expectedOutput: String,
  isHidden: { type: Boolean, default: false },
});

const questionSchema = new Schema<IQuestion>(
  {
    type: {
      type: String,
      enum: ['aptitude', 'mcq', 'coding', 'sql', 'debugging'],
      required: true,
    },
    category: {
      type: String,
      enum: ['aptitude', 'logical_reasoning', 'quantitative', 'verbal_ability'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    question: { type: String, required: true },
    options: [String],
    correctAnswer: String,
    testCases: [testCaseSchema],
    language: String,
    starterCode: String,
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

questionSchema.index({ type: 1, category: 1, difficulty: 1 });
questionSchema.index({ isActive: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
