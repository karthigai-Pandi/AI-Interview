import { Request, Response } from 'express';
import {
  User,
  Job,
  Application,
  Interview,
  Result,
  Question,
  Notification,
} from '../models';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../services/notifications';

export const dashboardController = {
  async getStats(req: Request, res: Response): Promise<void> {
    const role = req.user!.role;

    if (role === 'candidate') {
      const applications = await Application.find({ candidateId: req.user!._id });
      const interviews = await Interview.find({ candidateId: req.user!._id });
      const results = await Result.find({ candidateId: req.user!._id });

      res.json({
        success: true,
        data: {
          totalApplications: applications.length,
          activeApplications: applications.filter((a) =>
            ['applied', 'screening', 'assessment', 'interview'].includes(a.status)
          ).length,
          completedInterviews: interviews.filter((i) => i.status === 'completed').length,
          avgScore:
            results.length > 0
              ? Math.round(results.reduce((s, r) => s + r.overallScore, 0) / results.length)
              : 0,
          recentApplications: applications.slice(-5).reverse(),
        },
      });
      return;
    }

    if (role === 'recruiter') {
      const jobs = await Job.find({ recruiterId: req.user!._id });
      const jobIds = jobs.map((j) => j._id);
      const applications = await Application.find({ jobId: { $in: jobIds } });

      res.json({
        success: true,
        data: {
          totalJobs: jobs.length,
          activeJobs: jobs.filter((j) => j.status === 'active').length,
          totalApplications: applications.length,
          pendingReview: applications.filter((a) => a.status === 'interview').length,
          shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
        },
      });
      return;
    }

    if (role === 'admin') {
      const [users, jobs, applications, questions] = await Promise.all([
        User.countDocuments(),
        Job.countDocuments(),
        Application.countDocuments(),
        Question.countDocuments(),
      ]);

      res.json({
        success: true,
        data: { users, jobs, applications, questions },
      });
      return;
    }

    res.json({ success: true, data: {} });
  },

  async getNotifications(req: Request, res: Response): Promise<void> {
    const notifications = await getUserNotifications(req.user!._id.toString());
    const unreadCount = await getUnreadCount(req.user!._id.toString());
    res.json({ success: true, data: { notifications, unreadCount } });
  },

  async markRead(req: Request, res: Response): Promise<void> {
    const notification = await markNotificationRead(req.params.id, req.user!._id.toString());
    res.json({ success: true, data: notification });
  },

  async markAllRead(req: Request, res: Response): Promise<void> {
    await markAllNotificationsRead(req.user!._id.toString());
    res.json({ success: true, message: 'All notifications marked as read' });
  },
};
