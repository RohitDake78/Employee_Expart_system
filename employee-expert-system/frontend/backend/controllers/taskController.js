const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks (manager sees all, employee sees own)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let query = {};
    const { status, priority, search } = req.query;

    if (req.user.role === 'employee') {
      query.assignedTo = req.user.id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Auto-mark overdue tasks
    await Task.updateMany(
      { deadline: { $lt: new Date() }, status: { $nin: ['completed', 'overdue'] } },
      { status: 'overdue' }
    );

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Employees can only see their own tasks
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Manager
const createTask = async (req, res) => {
  try {
    const { title, description, deadline, priority, assignedTo, tags } = req.body;

    const employee = await User.findById(assignedTo);
    if (!employee || employee.role !== 'employee') {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const task = await Task.create({
      title,
      description,
      deadline,
      priority,
      assignedTo,
      createdBy: req.user.id,
      tags,
    });

    await task.populate('assignedTo', 'name email department');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task (manager full update, employee status/progress only)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role === 'employee') {
      // Employee can only update status and progress on their assigned task
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      const { status, progress } = req.body;
      if (status) task.status = status;
      if (progress !== undefined) task.progress = progress;
    } else {
      // Manager can update everything
      const { title, description, deadline, priority, assignedTo, tags, status } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (deadline) task.deadline = deadline;
      if (priority) task.priority = priority;
      if (assignedTo) task.assignedTo = assignedTo;
      if (tags) task.tags = tags;
      if (status) task.status = status;
    }

    await task.save();
    await task.populate('assignedTo', 'name email department');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Manager
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = {
      user: req.user.id,
      userName: req.user.name,
      text: req.body.text,
    };

    task.comments.push(comment);
    await task.save();

    res.status(201).json({ success: true, comments: task.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get task analytics / performance stats
// @route   GET /api/tasks/analytics
// @access  Private/Manager
const getAnalytics = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const overdueTasks = await Task.countDocuments({ status: 'overdue' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });

    // Per-employee performance
    const employeeStats = await Task.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdueTasks: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
          avgProgress: { $avg: '$progress' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      { $unwind: '$employee' },
      {
        $project: {
          name: '$employee.name',
          email: '$employee.email',
          department: '$employee.department',
          totalTasks: 1,
          completedTasks: 1,
          overdueTasks: 1,
          avgProgress: { $round: ['$avgProgress', 1] },
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
              1,
            ],
          },
        },
      },
    ]);

    res.json({
      success: true,
      analytics: {
        summary: { totalTasks, completedTasks, overdueTasks, inProgressTasks, pendingTasks },
        employeeStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, addComment, getAnalytics };
