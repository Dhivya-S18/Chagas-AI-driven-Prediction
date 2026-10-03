import express from 'express';
import { getAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getAlerts);

export default router;