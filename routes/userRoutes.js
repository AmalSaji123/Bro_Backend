import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'superadmin'), getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteUser);
router.put('/:id/toggle-status', protect, authorize('admin', 'superadmin'), toggleUserStatus);

export default router;
