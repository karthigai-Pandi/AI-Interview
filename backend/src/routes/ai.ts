import { Router } from 'express';
import { aiController } from '../controllers/assessmentController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { resumeAnalyzeSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/resume/analyze', aiLimiter, validateBody(resumeAnalyzeSchema), aiController.analyzeResume);
router.get('/resume/reports/:id', aiController.getReport);

export default router;
