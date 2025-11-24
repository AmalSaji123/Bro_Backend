import Chat from '../models/Chat.js';
import Concern from '../models/Concern.js';
import { emitNewMessage } from '../services/socketService.js';

// @desc    Get messages for a concern
// @route   GET /api/chat/:concernId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { concernId } = req.params;

    // Check if concern exists and user has access
    const concern = await Concern.findById(concernId);
    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check access permissions
    const isStudent = req.user.role === 'student' && concern.student.toString() === req.user._id.toString();
    const isAssigned = concern.assignedTo && concern.assignedTo.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isStudent && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat'
      });
    }

    const messages = await Chat.find({ concern: concernId })
      .populate('sender', 'name role profileImage')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching messages'
    });
  }
};

// @desc    Send a message
// @route   POST /api/chat/:concernId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { message } = req.body;

    // Check if concern exists
    const concern = await Concern.findById(concernId);
    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check access permissions
    const isStudent = req.user.role === 'student' && concern.student.toString() === req.user._id.toString();
    const isAssigned = concern.assignedTo && concern.assignedTo.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isStudent && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this chat'
      });
    }

    // Create message
    const chatMessage = await Chat.create({
      concern: concernId,
      sender: req.user._id,
      message,
      attachments: req.files ? req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      })) : []
    });

    // Populate sender details
    await chatMessage.populate('sender', 'name role profileImage');

    // Emit real-time message
    emitNewMessage(concernId, chatMessage);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending message'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:concernId/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { concernId } = req.params;

    await Chat.updateMany(
      { 
        concern: concernId, 
        sender: { $ne: req.user._id },
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error marking messages as read'
    });
  }
};
