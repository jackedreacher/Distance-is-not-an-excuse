const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('User ID:', existingUser._id);
      console.log('Email:', existingUser.email);
      console.log('Username:', existingUser.username);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Create test user
    const newUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      profile: {
        name: 'Test User',
        gender: 'other'
      }
    });

    await newUser.save();
    console.log('Test user created successfully!');
    console.log('User ID:', newUser._id);
    console.log('Email:', newUser.email);
    console.log('Username:', newUser.username);
    console.log('Password: test123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedUser();