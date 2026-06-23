import { Router } from 'express';
import { assessmentController } from '../controllers/assessmentController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  aptitudeStartSchema,
  technicalStartSchema,
  submitAnswerSchema,
  runCodeSchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate, requireRole('candidate'));

router.post('/aptitude/start', validateBody(aptitudeStartSchema), assessmentController.startAptitude);
router.post(
  '/aptitude/:sessionId/submit',
  validateBody(submitAnswerSchema),
  assessmentController.submitAptitude
);
router.post('/technical/start', validateBody(technicalStartSchema), assessmentController.startTechnical);
router.post('/technical/:sessionId/run-code', validateBody(runCodeSchema), assessmentController.runCode);
router.post(
  '/technical/:sessionId/submit',
  validateBody(submitAnswerSchema),
  assessmentController.submitTechnical
);
router.post('/proctoring/analyze', assessmentController.analyzeProctoring);

export default router;
