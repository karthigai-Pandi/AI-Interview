import { Request, Response } from 'express';
import { User, Application, Job } from '../models';
import { uploadToCloudinary } from '../services/cloudinary';
import { createNotification } from '../services/notifications';

export const candidateController = {
  async getProfile(req: Request, res: Response): Promise<void> {
    const user = await User.findById(req.user!._id);
    res.json({
      success: true,
      data: {
        id: user!._id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        avatar: user!.avatar,
        profile: user!.profile || {},
      },
    });
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    const { name, ...profileFields } = req.body;
    const update: Record<string, unknown> = {};

    if (name) update.name = name;
    if (Object.keys(profileFields).length > 0) {
      const user = await User.findById(req.user!._id);
      update.profile = { ...user?.profile, ...profileFields };
    }

    const user = await User.findByIdAndUpdate(req.user!._id, update, { new: true });
    res.json({ success: true, data: { profile: user?.profile, name: user?.name } });
  },

  async uploadResume(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Resume file required' });
      return;
    }

    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      `${req.user!._id}-${Date.now()}-${req.file.originalname}`
    );

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { 'profile.resumeUrl': url, 'profile.resumePublicId': publicId },
      { new: true }
    );

    res.json({
      success: true,
      data: { resumeUrl: url, profile: user?.profile },
    });
  },

  async getApplications(req: Request, res: Response): Promise<void> {
    const applications = await Application.find({ candidateId: req.user!._id })
      .populate('jobId', 'title companyInfo status skills interviewConfig')
      .sort({ appliedAt: -1 });

    res.json({ success: true, data: applications });
  },

  async getApplicationStatus(req: Request, res: Response): Promise<void> {
    const application = await Application.findOne({
      _id: req.params.id,
      candidateId: req.user!._id,
    }).populate('jobId', 'title interviewConfig');

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    res.json({ success: true, data: application });
  },

  async applyToJob(req: Request, res: Response): Promise<void> {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);

    if (!job || job.status !== 'active') {
      res.status(404).json({ success: false, message: 'Job not found or not active' });
      return;
    }

    const existing = await Application.findOne({
      candidateId: req.user!._id,
      jobId,
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'Already applied to this job' });
      return;
    }

    const user = await User.findById(req.user!._id);
    const application = await Application.create({
      candidateId: req.user!._id,
      jobId,
      status: 'applied',
      resumeUrl: user?.profile?.resumeUrl,
      currentStage: 'Application Submitted',
    });

    await createNotification(
      job.recruiterId.toString(),
      'new_application',
      'New Application',
      `${user?.name} applied for ${job.title}`,
      `/recruiter/candidates?jobId=${jobId}`
    );

    res.status(201).json({ success: true, data: application });
  },

  async getAvailableJobs(req: Request, res: Response): Promise<void> {
    const jobs = await Job.find({ status: 'active' })
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    const appliedJobIds = (
      await Application.find({ candidateId: req.user!._id }).select('jobId')
    ).map((a) => a.jobId.toString());

    const jobsWithApplied = jobs.map((job) => ({
      ...job.toObject(),
      hasApplied: appliedJobIds.includes(job._id.toString()),
    }));

    res.json({ success: true, data: jobsWithApplied });
  },
};
