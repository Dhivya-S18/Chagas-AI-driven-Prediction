import express from 'express';

import {
  getECGById,
  getECGRecords,
  startECGMonitoring,
  stopECGMonitoring,
  getECGMonitoringStatus,
} from '../controllers/ecgController.js';

import { extractECGFeatures } from '../controllers/ecgFeatureController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/features', extractECGFeatures);

router.get('/', getECGRecords);

router.post('/monitor/start', startECGMonitoring);
router.post('/monitor/stop', stopECGMonitoring);
router.get('/monitor/status', getECGMonitoringStatus);

router.get('/:id', getECGById);

export default router;