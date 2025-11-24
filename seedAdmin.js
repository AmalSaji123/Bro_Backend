import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@brototype.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email: admin@brototype.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@brototype.com',
      password: 'admin123', // Will be hashed by the model
      role: 'admin',
      campus: 'Kochi',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log('Email: admin@brototype.com');
    console.log('Password: admin123');
    console.log('\n🔗 Login at: http://localhost:4000/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
