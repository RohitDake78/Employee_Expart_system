const express = require('express');
const router = express.Router();
const { getEmployees, getProfile, updateProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/employees', authorize('manager'), getEmployees);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
