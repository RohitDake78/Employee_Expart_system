const User = require('../models/User');

// @desc    Get all employees (for manager to assign tasks)
// @route   GET /api/users/employees
// @access  Private/Manager
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee', isActive: true }).select(
      'name email department lastLogin createdAt'
    );
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, department },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getEmployees, getProfile, updateProfile };
