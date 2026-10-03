import express from 'express';
import { createReport, downloadReport, getReportById, getReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getReports);
router.post('/', createReport);
router.get('/:id/download', downloadReport);
router.get('/:id', getReportById);

export default router;
