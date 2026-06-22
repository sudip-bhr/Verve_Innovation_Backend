require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword } = require('../src/utils/password');
const AdminUser = require('../src/models/AdminUser');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Missing MONGODB_URI');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Usage: node createAdmin.js <email> <password>');
      process.exit(1);
    }

    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      console.log('Admin user already exists with this email.');
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);

    await AdminUser.create({
      email,
      passwordHash,
      role: 'owner', // The initial admin should be the owner
    });

    console.log(`Admin user ${email} created successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
