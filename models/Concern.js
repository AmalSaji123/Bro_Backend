import mongoose from 'mongoose';

const concernSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technical',
      'Personal',
      'Financial',
      'Behavioral',
      'Misconduct',
      'Infrastructure',
      'Course Content',
      'Mentor Related',
      'Other'
    ]
  },
  severity: {
    type: String,
    required: [true, 'Severity is required'],
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
    default: 'Submitted'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  campus: {
    type: String,
    enum: ['Kochi', 'Calicut', 'Trivandrum', 'Other']
  }
}, {
  timestamps: true
});

// Generate unique ticket ID before validation
concernSchema.pre('validate', async function(next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Concern').countDocuments();
    this.ticketId = `BRT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Concern = mongoose.model('Concern', concernSchema);

export default Concern;
