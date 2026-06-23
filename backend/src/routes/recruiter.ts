import { Router } from 'express';
import { recruiterController } from '../controllers/recruiterController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  jobSchema,
  applicationStatusSchema,
  paginationSchema,
  scheduleInterviewSchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate, requireRole('recruiter', 'admin'));

router.get('/jobs', recruiterController.getJobs);
router.get('/jobs/:id', recruiterController.getJob);
router.post('/jobs', validateBody(jobSchema), recruiterController.createJob);
router.put('/jobs/:id', validateBody(jobSchema.partial()), recruiterController.updateJob);
router.delete('/jobs/:id', recruiterController.deleteJob);
router.get('/candidates', validateQuery(paginationSchema), recruiterController.getCandidates);
router.patch(
  '/applications/:id/status',
  validateBody(applicationStatusSchema),
  recruiterController.updateApplicationStatus
);
router.patch(
  '/applications/:id/schedule',
  validateBody(scheduleInterviewSchema),
  recruiterController.scheduleInterview
);
router.get('/candidates/export', recruiterController.exportCandidatesCsv);
router.get('/reports/:applicationId', recruiterController.getReport);
router.get('/analytics', recruiterController.getAnalytics);

export default router;
