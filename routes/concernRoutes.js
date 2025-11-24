import express from 'express';
import {
  createConcern,
  getAllConcerns,
  getConcernById,
  updateConcernStatus,
  assignConcern,
  rateConcern,
  deleteConcern,
  getConcernStats
} from '../controllers/concernController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public stats route (for dashboard)
router.get('/stats', protect, authorize('admin', 'superadmin'), getConcernStats);

// Concern CRUD
router.post('/', protect, authorize('student'), upload.array('attachments', 5), handleMulterError, createConcern);
router.get('/', protect, getAllConcerns);
router.get('/:id', protect, getConcernById);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteConcern);

// Concern actions
router.put('/:id/status', protect, authorize('mentor', 'admin', 'superadmin'), updateConcernStatus);
router.put('/:id/assign', protect, authorize('admin', 'superadmin'), assignConcern);
router.put('/:id/rate', protect, authorize('student'), rateConcern);

export default router;
