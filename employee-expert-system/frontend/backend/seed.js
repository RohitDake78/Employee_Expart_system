/**
 * Seed Script — Employee Expert System
 * Creates demo manager, employees, and sample tasks.
 * Run: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Task = require('./models/Task');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_expert_system';

const users = [
  { name: 'Ravi Sharma', email: 'manager@demo.com', password: 'demo1234', role: 'manager', department: 'Management' },
  { name: 'Priya Patel', email: 'employee@demo.com', password: 'demo1234', role: 'employee', department: 'Engineering' },
  { name: 'Amit Verma', email: 'amit@demo.com', password: 'demo1234', role: 'employee', department: 'Design' },
  { name: 'Sneha Iyer', email: 'sneha@demo.com', password: 'demo1234', role: 'employee', department: 'Marketing' },
  { name: 'Karan Mehta', email: 'karan@demo.com', password: 'demo1234', role: 'employee', department: 'Engineering' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('🗑  Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`👥 Created ${createdUsers.length} users`);

    const manager = createdUsers.find(u => u.role === 'manager');
    const employees = createdUsers.filter(u => u.role === 'employee');

    const now = new Date();
    const future = (days) => new Date(now.getTime() + days * 24*60*60*1000);
    const past = (days) => new Date(now.getTime() - days * 24*60*60*1000);

    const tasks = [
      { title: 'Build REST API for user authentication', description: 'Implement JWT-based login, signup and token refresh endpoints using Express.js and MongoDB.', deadline: future(7), priority: 'high', assignedTo: employees[0]._id, createdBy: manager._id, status: 'in-progress', progress: 65, tags: ['backend', 'auth', 'api'] },
      { title: 'Design landing page mockup', description: 'Create high-fidelity Figma mockups for the new product landing page including mobile responsive views.', deadline: future(3), priority: 'critical', assignedTo: employees[1]._id, createdBy: manager._id, status: 'in-progress', progress: 40, tags: ['design', 'figma', 'ui'] },
      { title: 'Write Q3 marketing campaign copy', description: 'Draft email sequences, social media posts, and blog article for the Q3 product launch campaign.', deadline: future(14), priority: 'medium', assignedTo: employees[2]._id, createdBy: manager._id, status: 'pending', progress: 0, tags: ['marketing', 'content'] },
      { title: 'Fix login page responsiveness bug', description: 'The login form breaks on mobile screens below 375px. Needs CSS fix and cross-browser testing.', deadline: future(2), priority: 'high', assignedTo: employees[0]._id, createdBy: manager._id, status: 'pending', progress: 0, tags: ['bug', 'frontend', 'css'] },
      { title: 'Implement dark mode for dashboard', description: 'Add dark/light theme toggle using CSS variables. Persist preference in localStorage.', deadline: future(10), priority: 'low', assignedTo: employees[3]._id, createdBy: manager._id, status: 'completed', progress: 100, tags: ['frontend', 'ui', 'enhancement'] },
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions to run tests and deploy to staging on every push to main branch.', deadline: future(5), priority: 'high', assignedTo: employees[3]._id, createdBy: manager._id, status: 'in-progress', progress: 55, tags: ['devops', 'ci-cd'] },
      { title: 'Database performance audit', description: 'Analyze slow queries, add indexes, and optimize MongoDB aggregation pipelines for the reporting module.', deadline: past(2), priority: 'critical', assignedTo: employees[0]._id, createdBy: manager._id, status: 'overdue', progress: 30, tags: ['database', 'performance'] },
      { title: 'User onboarding flow redesign', description: 'Redesign the 4-step onboarding wizard to improve completion rates. A/B test two variants.', deadline: future(20), priority: 'medium', assignedTo: employees[1]._id, createdBy: manager._id, status: 'pending', progress: 0, tags: ['design', 'ux', 'onboarding'] },
      { title: 'Write unit tests for API controllers', description: 'Achieve 80% test coverage for all Express route handlers using Jest and Supertest.', deadline: future(8), priority: 'medium', assignedTo: employees[3]._id, createdBy: manager._id, status: 'pending', progress: 10, tags: ['testing', 'backend'] },
      { title: 'Quarterly newsletter design', description: 'Design and code HTML email template for Q3 newsletter. Must work in Outlook, Gmail and Apple Mail.', deadline: past(1), priority: 'high', assignedTo: employees[2]._id, createdBy: manager._id, status: 'overdue', progress: 70, tags: ['email', 'design', 'marketing'] },
    ];

    await Task.create(tasks);
    console.log(`📋 Created ${tasks.length} sample tasks`);

    console.log('\n🎉 Seed complete! Demo credentials:');
    console.log('   Manager  → manager@demo.com / demo1234');
    console.log('   Employee → employee@demo.com / demo1234');
    console.log('   Employee → amit@demo.com / demo1234');
    console.log('   Employee → sneha@demo.com / demo1234');
    console.log('   Employee → karan@demo.com / demo1234\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
