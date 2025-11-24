import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { initializeSocket } from './services/socketService.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import concernRoutes from './routes/concernRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Connect to database
connectDB();

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/concerns', concernRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║                                            ║
  ║   🎓 Brototype ConcernRise Server         ║
  ║                                            ║
  ║   Server running on port ${PORT}            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║                                            ║
  ╚════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});
