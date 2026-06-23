import { Router } from 'express';
import authRoutes from './auth';
import candidateRoutes from './candidate';
import recruiterRoutes from './recruiter';
import adminRoutes from './admin';
import assessmentRoutes from './assessments';
import interviewRoutes from './interviews';
import aiRoutes from './ai';
import dashboardRoutes from './dashboard';

const router = Router();

router.use('/auth', authRoutes);
router.use('/candidate', candidateRoutes);
router.use('/recruiter', recruiterRoutes);
router.use('/admin', adminRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/interviews/ai', interviewRoutes);
router.use('/ai', aiRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

export default router;
