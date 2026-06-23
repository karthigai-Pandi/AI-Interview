import { Router } from 'express';
import { candidateController } from '../controllers/candidateController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { uploadResume, handleUploadError } from '../middleware/upload';
import { profileUpdateSchema, applyJobSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate, requireRole('candidate'));

router.get('/profile', candidateController.getProfile);
router.put('/profile', validateBody(profileUpdateSchema), candidateController.updateProfile);
router.post(
  '/resume',
  uploadResume.single('resume'),
  handleUploadError,
  candidateController.uploadResume
);
router.get('/applications', candidateController.getApplications);
router.get('/applications/:id/status', candidateController.getApplicationStatus);
router.post('/apply', validateBody(applyJobSchema), candidateController.applyToJob);
router.get('/jobs', candidateController.getAvailableJobs);

export default router;
