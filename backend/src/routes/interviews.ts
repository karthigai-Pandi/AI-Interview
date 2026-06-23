import { Router } from 'express';
import { interviewController } from '../controllers/assessmentController';
import { authenticate, requireRole } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validate';
import { aiInterviewStartSchema, aiMessageSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate, requireRole('candidate'));

router.post('/start', aiLimiter, validateBody(aiInterviewStartSchema), interviewController.startAiInterview);
router.post('/:id/message', aiLimiter, validateBody(aiMessageSchema), interviewController.sendMessage);
router.get('/:id/next-question', interviewController.getNextQuestion);
router.post('/:id/complete', aiLimiter, interviewController.completeInterview);
router.patch('/:id/anti-cheat', interviewController.updateAntiCheat);

export default router;
