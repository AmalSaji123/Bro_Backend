import express from 'express';
import { getMessages, sendMessage, markAsRead } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, handleMulterError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/:concernId', protect, getMessages);
router.post('/:concernId', protect, upload.array('attachments', 3), handleMulterError, sendMessage);
router.put('/:concernId/read', protect, markAsRead);

export default router;
