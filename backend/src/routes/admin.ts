import { Router } from 'express';
import { adminController } from '../controllers/recruiterController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { questionSchema, roleUpdateSchema, paginationSchema, systemSettingsSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/users', validateQuery(paginationSchema), adminController.getUsers);
router.patch('/users/:id/role', validateBody(roleUpdateSchema), adminController.updateUserRole);
router.get('/questions', adminController.getQuestions);
router.post('/questions', validateBody(questionSchema), adminController.createQuestion);
router.put('/questions/:id', validateBody(questionSchema.partial()), adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.get('/ai-config', adminController.getAiConfig);
router.patch('/ai-config', validateBody(systemSettingsSchema), adminController.updateAiConfig);

export default router;
