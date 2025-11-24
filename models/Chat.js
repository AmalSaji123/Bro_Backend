import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  concern: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concern',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
chatSchema.index({ concern: 1, createdAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
