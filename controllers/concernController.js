import Concern from '../models/Concern.js';
import User from '../models/User.js';
import { sendConcernSubmissionEmail, sendStatusUpdateEmail, sendAssignmentEmail } from '../services/emailService.js';
import { emitStatusUpdate } from '../services/socketService.js';

// @desc    Create new concern
// @route   POST /api/concerns
// @access  Private (Student)
export const createConcern = async (req, res) => {
  try {
    const { title, description, category, severity, isAnonymous, campus } = req.body;

    // Create concern
    const concern = await Concern.create({
      student: req.user._id,
      title,
      description,
      category,
      severity,
      isAnonymous: isAnonymous || false,
      campus: campus || req.user.campus,
      timeline: [{
        status: 'Submitted',
        timestamp: new Date()
      }]
    });

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      concern.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
      await concern.save();
    }

    // Populate student details
    await concern.populate('student', 'name email campus');

    // Send email notification to admin
    await sendConcernSubmissionEmail(concern, req.user);

    res.status(201).json({
      success: true,
      message: 'Concern submitted successfully',
      data: concern
    });
  } catch (error) {
    console.error('Create concern error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating concern'
    });
  }
};

// @desc    Get all concerns
// @route   GET /api/concerns
// @access  Private
export const getAllConcerns = async (req, res) => {
  try {
    const { status, category, severity, campus, search } = req.query;
    
    let query = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'mentor') {
      query.assignedTo = req.user._id;
    }
    // Admin and superadmin can see all

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (campus) query.campus = campus;
    
    // Search by title or ticket ID
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const concerns = await Concern.find(query)
      .populate('student', 'name email campus batch')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: concerns.length,
      data: concerns
    });
  } catch (error) {
    console.error('Get concerns error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching concerns'
    });
  }
};

// @desc    Get single concern
// @route   GET /api/concerns/:id
// @access  Private
export const getConcernById = async (req, res) => {
  try {
    const concern = await Concern.findById(req.params.id)
      .populate('student', 'name email campus batch phone')
      .populate('assignedTo', 'name email role')
      .populate('timeline.updatedBy', 'name role');

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'student' && concern.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this concern'
      });
    }

    res.status(200).json({
      success: true,
      data: concern
    });
  } catch (error) {
    console.error('Get concern error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching concern'
    });
  }
};

// @desc    Update concern status
// @route   PUT /api/concerns/:id/status
// @access  Private (Mentor, Admin, SuperAdmin)
export const updateConcernStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;

    const concern = await Concern.findById(req.params.id)
      .populate('student', 'name email');

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Update status
    concern.status = status;
    concern.timeline.push({
      status,
      updatedBy: req.user._id,
      comment: comment || '',
      timestamp: new Date()
    });

    await concern.save();

    // Send email notification to student
    await sendStatusUpdateEmail(concern, concern.student, req.user, comment);

    // Emit real-time update
    emitStatusUpdate(concern._id, {
      status,
      updatedBy: req.user.name,
      comment,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Concern status updated successfully',
      data: concern
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating concern status'
    });
  }
};

// @desc    Assign concern to mentor/admin
// @route   PUT /api/concerns/:id/assign
// @access  Private (Admin, SuperAdmin)
export const assignConcern = async (req, res) => {
  try {
    const { mentorId } = req.body;

    const concern = await Concern.findById(req.params.id)
      .populate('student', 'name email');

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Assign concern
    concern.assignedTo = mentorId;
    concern.status = 'Assigned';
    concern.timeline.push({
      status: 'Assigned',
      updatedBy: req.user._id,
      comment: `Assigned to ${mentor.name}`,
      timestamp: new Date()
    });

    await concern.save();

    // Send emails
    await sendAssignmentEmail(concern, concern.student, mentor);
    await sendStatusUpdateEmail(concern, concern.student, req.user, `Assigned to ${mentor.name}`);

    // Emit real-time update
    emitStatusUpdate(concern._id, {
      status: 'Assigned',
      assignedTo: mentor.name,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Concern assigned successfully',
      data: concern
    });
  } catch (error) {
    console.error('Assign concern error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning concern'
    });
  }
};

// @desc    Rate concern resolution
// @route   PUT /api/concerns/:id/rate
// @access  Private (Student)
export const rateConcern = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const concern = await Concern.findById(req.params.id);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check if student owns this concern
    if (concern.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this concern'
      });
    }

    // Check if concern is resolved
    if (concern.status !== 'Resolved' && concern.status !== 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate resolved or closed concerns'
      });
    }

    concern.rating = rating;
    concern.feedback = feedback || '';
    await concern.save();

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: concern
    });
  } catch (error) {
    console.error('Rate concern error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error rating concern'
    });
  }
};

// @desc    Delete concern
// @route   DELETE /api/concerns/:id
// @access  Private (Admin, SuperAdmin)
export const deleteConcern = async (req, res) => {
  try {
    const concern = await Concern.findById(req.params.id);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    await concern.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Concern deleted successfully'
    });
  } catch (error) {
    console.error('Delete concern error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting concern'
    });
  }
};

// @desc    Get concern statistics
// @route   GET /api/concerns/stats
// @access  Private (Admin, SuperAdmin)
export const getConcernStats = async (req, res) => {
  try {
    const totalConcerns = await Concern.countDocuments();
    const pendingConcerns = await Concern.countDocuments({ 
      status: { $in: ['Submitted', 'In Review', 'Assigned', 'In Progress'] } 
    });
    const resolvedConcerns = await Concern.countDocuments({ status: 'Resolved' });
    const closedConcerns = await Concern.countDocuments({ status: 'Closed' });

    // Category distribution
    const categoryStats = await Concern.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Severity distribution
    const severityStats = await Concern.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalConcerns,
        pending: pendingConcerns,
        resolved: resolvedConcerns,
        closed: closedConcerns,
        categoryDistribution: categoryStats,
        severityDistribution: severityStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics'
    });
  }
};
