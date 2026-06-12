const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getAnalytics,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All task routes require login

router.get('/analytics', authorize('manager'), getAnalytics);
router.route('/').get(getTasks).post(authorize('manager'), createTask);
router.route('/:id').get(getTask).put(updateTask).delete(authorize('manager'), deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
