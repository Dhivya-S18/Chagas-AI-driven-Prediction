import express from 'express';
import { createAnalysis, getAnalysisById, getAnalyses } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getAnalyses);
router.post('/', createAnalysis);
router.get('/:id', getAnalysisById);

export default router;
