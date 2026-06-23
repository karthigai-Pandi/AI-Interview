import { Request, Response } from 'express';
import { Job, Application, User, Report, Result, Interview, Question } from '../models';
import { getSystemSettings } from '../models/SystemSettings';
import { createNotification } from '../services/notifications';

function isAdmin(req: Request): boolean {
  return req.user!.role === 'admin';
}

async function getRecruiterJobFilter(req: Request) {
  return isAdmin(req) ? {} : { recruiterId: req.user!._id };
}

async function getRecruiterJobIds(req: Request) {
  const filter = await getRecruiterJobFilter(req);
  const jobs = await Job.find(filter).select('_id');
  return jobs.map((j) => j._id);
}

async function canAccessJobRecruiter(req: Request, recruiterId: string): Promise<boolean> {
  return isAdmin(req) || req.user!._id.toString() === recruiterId;
}

export const recruiterController = {
  async getJobs(req: Request, res: Response): Promise<void> {
    const filter = await getRecruiterJobFilter(req);
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  },

  async getJob(req: Request, res: Response): Promise<void> {
    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, recruiterId: req.user!._id };
    const job = await Job.findOne(filter);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, data: job });
  },

  async createJob(req: Request, res: Response): Promise<void> {
    const job = await Job.create({ ...req.body, recruiterId: req.user!._id });
    res.status(201).json({ success: true, data: job });
  },

  async updateJob(req: Request, res: Response): Promise<void> {
    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, recruiterId: req.user!._id };
    const job = await Job.findOneAndUpdate(filter, req.body, { new: true });
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, data: job });
  },

  async deleteJob(req: Request, res: Response): Promise<void> {
    const filter = isAdmin(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, recruiterId: req.user!._id };
    const job = await Job.findOneAndDelete(filter);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, message: 'Job deleted' });
  },

  async getCandidates(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 10, search, status, jobId } = req.query as {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      jobId?: string;
    };

    const jobIds = await getRecruiterJobIds(req);

    const filter: Record<string, unknown> = { jobId: { $in: jobIds } };
    if (jobId) filter.jobId = jobId;
    if (status) filter.status = status;

    let applications = await Application.find(filter)
      .populate('candidateId', 'name email avatar profile')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      applications = applications.filter((app) => {
        const candidate = app.candidateId as unknown as { name?: string; email?: string };
        return (
          candidate?.name?.toLowerCase().includes(searchLower) ||
          candidate?.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    const total = applications.length;
    const start = (Number(page) - 1) * Number(limit);
    const paginated = applications.slice(start, start + Number(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  },

  async updateApplicationStatus(req: Request, res: Response): Promise<void> {
    const { status, currentStage } = req.body;
    const application = await Application.findById(req.params.id).populate('jobId');

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const job = application.jobId as unknown as {
      recruiterId: { toString(): string };
      title?: string;
    };
    if (!(await canAccessJobRecruiter(req, job.recruiterId.toString()))) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    application.status = status;
    if (currentStage) application.currentStage = currentStage;
    await application.save();

    const jobTitle = (application.jobId as unknown as { title?: string })?.title || 'your application';
    await createNotification(
      application.candidateId.toString(),
      'application_status',
      `Application ${status}`,
      `Your application for ${jobTitle} has been updated to: ${status}`,
      '/candidate/applications'
    );

    res.json({ success: true, data: application });
  },

  async scheduleInterview(req: Request, res: Response): Promise<void> {
    const { scheduledInterviewAt, interviewType, interviewNotes } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title recruiterId');

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const job = application.jobId as unknown as {
      title: string;
      recruiterId: { toString(): string };
    };
    if (!(await canAccessJobRecruiter(req, job.recruiterId.toString()))) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    application.scheduledInterviewAt = new Date(scheduledInterviewAt);
    application.interviewType = interviewType;
    application.interviewNotes = interviewNotes;
    application.currentStage = 'Interview Scheduled';
    if (application.status === 'applied' || application.status === 'screening') {
      application.status = 'interview';
    }
    await application.save();

    const candidate = application.candidateId as unknown as {
      _id: { toString(): string };
      name: string;
    };
    const dateStr = new Date(scheduledInterviewAt).toLocaleString();

    await createNotification(
      candidate._id.toString(),
      'interview_scheduled',
      'Interview Scheduled',
      `Your ${interviewType} interview for ${job.title} is scheduled for ${dateStr}`,
      '/candidate/applications'
    );

    res.json({ success: true, data: application });
  },

  async exportCandidatesCsv(req: Request, res: Response): Promise<void> {
    const { jobId, status } = req.query as { jobId?: string; status?: string };

    const jobIds = await getRecruiterJobIds(req);

    const filter: Record<string, unknown> = { jobId: { $in: jobIds } };
    if (jobId) filter.jobId = jobId;
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 });

    const header = 'Name,Email,Job,Status,Stage,Applied At,Scheduled Interview,Interview Type\n';
    const rows = applications.map((app) => {
      const candidate = app.candidateId as unknown as { name?: string; email?: string };
      const job = app.jobId as unknown as { title?: string };
      const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      return [
        escape(candidate?.name || ''),
        escape(candidate?.email || ''),
        escape(job?.title || ''),
        escape(app.status),
        escape(app.currentStage),
        escape(app.appliedAt?.toISOString() || ''),
        escape(app.scheduledInterviewAt?.toISOString() || ''),
        escape(app.interviewType || ''),
      ].join(',');
    });

    const csv = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');
    res.send(csv);
  },

  async getReport(req: Request, res: Response): Promise<void> {
    const application = await Application.findById(req.params.applicationId)
      .populate('candidateId', 'name email profile')
      .populate('jobId', 'title description skills');

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const job = application.jobId as unknown as { recruiterId: { toString(): string } };
    if (!(await canAccessJobRecruiter(req, job.recruiterId.toString()))) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const resumeReport = application.resumeAnalysisId
      ? await Report.findById(application.resumeAnalysisId)
      : null;

    const interviews = await Interview.find({ applicationId: application._id });
    const results = await Result.find({ applicationId: application._id });

    res.json({
      success: true,
      data: {
        application,
        resumeReport,
        interviews,
        results,
      },
    });
  },

  async getAnalytics(req: Request, res: Response): Promise<void> {
    const filter = await getRecruiterJobFilter(req);
    const jobs = await Job.find(filter);
    const jobIds = jobs.map((j) => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } });
    const results = await Result.find({
      applicationId: { $in: applications.map((a) => a._id) },
    });

    const statusCounts = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const scoreDistribution = results.map((r) => ({
      applicationId: r.applicationId,
      overallScore: r.overallScore,
    }));

    const avgScore =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
        : 0;

    res.json({
      success: true,
      data: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => j.status === 'active').length,
        totalApplications: applications.length,
        statusCounts,
        avgScore: Math.round(avgScore),
        scoreDistribution,
        recentApplications: applications.slice(-5).reverse(),
      },
    });
  },
};

export const adminController = {
  async getUsers(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 10, search } = req.query as {
      page?: number;
      limit?: number;
      search?: string;
    };

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  },

  async updateUserRole(req: Request, res: Response): Promise<void> {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      '-passwordHash'
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  },

  async getQuestions(req: Request, res: Response): Promise<void> {
    const { type, category, difficulty, page = 1, limit = 20 } = req.query as {
      type?: string;
      category?: string;
      difficulty?: string;
      page?: number;
      limit?: number;
    };

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: questions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  },

  async createQuestion(req: Request, res: Response): Promise<void> {
    const question = await Question.create({ ...req.body, createdBy: req.user!._id });
    res.status(201).json({ success: true, data: question });
  },

  async updateQuestion(req: Request, res: Response): Promise<void> {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }
    res.json({ success: true, data: question });
  },

  async deleteQuestion(req: Request, res: Response): Promise<void> {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }
    res.json({ success: true, message: 'Question deleted' });
  },

  async getAiConfig(req: Request, res: Response): Promise<void> {
    const settings = await getSystemSettings();
    res.json({
      success: true,
      data: {
        aiModel: settings.aiModel,
        aiTemperature: settings.aiTemperature,
        proctoringEnabled: settings.proctoringEnabled,
        faceAnalysisEnabled: settings.faceAnalysisEnabled,
        maxInterviewQuestions: settings.maxInterviewQuestions,
        aiServiceConnected: true,
      },
    });
  },

  async updateAiConfig(req: Request, res: Response): Promise<void> {
    const settings = await getSystemSettings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, data: settings });
  },
};
