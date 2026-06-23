import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/notifications', dashboardController.getNotifications);
router.patch('/notifications/:id/read', dashboardController.markRead);
router.patch('/notifications/read-all', dashboardController.markAllRead);

export default router;
