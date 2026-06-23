import bcrypt from 'bcryptjs';
import {
  User,
  Job,
  Application,
  Question,
  Interview,
  Result,
  Report,
  Notification,
} from '../models';
import { aptitudeQuestions, technicalQuestions } from './data';

export async function seedDatabase(clearFirst = false): Promise<void> {
  if (clearFirst) {
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Question.deleteMany({}),
      Interview.deleteMany({}),
      Result.deleteMany({}),
      Report.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  }

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const recruiter1 = await User.create({
    email: 'recruiter1@aiinterview.com',
    passwordHash,
    name: 'Sarah Johnson',
    role: 'recruiter',
    isEmailVerified: true,
  });

  const recruiter2 = await User.create({
    email: 'recruiter2@aiinterview.com',
    passwordHash,
    name: 'Michael Chen',
    role: 'recruiter',
    isEmailVerified: true,
  });

  await User.create({
    email: 'admin@aiinterview.com',
    passwordHash,
    name: 'System Admin',
    role: 'admin',
    isEmailVerified: true,
  });

  const candidates = await User.insertMany([
    {
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice Williams',
      role: 'candidate',
      isEmailVerified: true,
      profile: {
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
        experience: [{ company: 'TechCorp', title: 'Frontend Developer', description: 'Built React apps', startDate: '2021-01', current: true }],
        education: [{ institution: 'MIT', degree: 'BS', field: 'Computer Science', startYear: 2017, endYear: 2021 }],
        certifications: [],
        portfolioLinks: ['https://alice.dev'],
        githubUrl: 'https://github.com/alice',
        linkedinUrl: 'https://linkedin.com/in/alice',
      },
    },
    {
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob Martinez',
      role: 'candidate',
      isEmailVerified: true,
      profile: { skills: ['Python', 'Django', 'PostgreSQL', 'AWS'], experience: [], education: [], certifications: [], portfolioLinks: [] },
    },
  ]);

  const jobs = await Job.insertMany([
    {
      title: 'Senior Full Stack Developer',
      description: 'We are looking for an experienced full stack developer proficient in React, Node.js, and MongoDB.',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
      experienceLevel: 'senior',
      recruiterId: recruiter1._id,
      status: 'active',
      companyInfo: { name: 'TechVision Inc', website: 'https://techvision.com', location: 'San Francisco, CA' },
    },
    {
      title: 'Frontend Engineer',
      description: 'Join our frontend team to build beautiful, responsive user interfaces using React and TypeScript.',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript'],
      experienceLevel: 'mid',
      recruiterId: recruiter1._id,
      status: 'active',
      companyInfo: { name: 'TechVision Inc', location: 'Remote' },
    },
    {
      title: 'Backend Python Developer',
      description: 'Build robust APIs and microservices using Python, FastAPI, and PostgreSQL.',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS'],
      experienceLevel: 'mid',
      recruiterId: recruiter2._id,
      status: 'active',
      companyInfo: { name: 'DataFlow Systems', location: 'New York, NY' },
    },
  ]);

  for (const q of aptitudeQuestions) {
    await Question.create({ type: 'aptitude', isActive: true, tags: ['seed'], ...q });
  }

  for (const q of technicalQuestions) {
    await Question.create({ isActive: true, tags: ['seed'], ...q });
  }

  const report = await Report.create({
    type: 'resume_analysis',
    candidateId: candidates[0]._id,
    jobId: jobs[0]._id,
    data: {
      skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
      atsScore: 82,
      jobMatchScore: 78,
      matchedSkills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
      missingSkills: ['AWS'],
      improvements: ['Add AWS certification'],
      recruiterSummary: 'Strong frontend developer with relevant full-stack experience.',
      experienceYears: 3,
    },
  });

  await Application.create({
    candidateId: candidates[0]._id,
    jobId: jobs[0]._id,
    status: 'interview',
    resumeAnalysisId: report._id,
    currentStage: 'Technical Assessment Completed',
  });

  console.log('Database seeded with demo accounts (password: Password123!)');
}

export async function ensureSeeded(): Promise<void> {
  const userCount = await User.countDocuments();
  const questionCount = await Question.countDocuments();

  if (userCount === 0) {
    console.log('Empty database detected — seeding demo data...');
    await seedDatabase(false);
    return;
  }

  if (questionCount === 0) {
    console.log('No questions found — seeding question bank...');
    for (const q of aptitudeQuestions) {
      await Question.create({ type: 'aptitude', isActive: true, tags: ['seed'], ...q });
    }
    for (const q of technicalQuestions) {
      await Question.create({ isActive: true, tags: ['seed'], ...q });
    }
  }
}
