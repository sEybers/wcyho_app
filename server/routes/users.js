const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ 
        error: user.email === email ? 'Email already in use' : 'Username already taken' 
      });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      role: 'user'
    });

    // Password will be hashed by pre-save hook
    await user.save();

    // Return JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/users/search
// @desc    Search for users by username or email
// @access  Private
router.get('/search', auth, async (req, res) => {
  const { query, field = 'username' } = req.query;

  try {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchField = field === 'email' ? 'email' : 'username';
    const searchRegex = new RegExp(query.trim(), 'i'); // Case-insensitive search

    const users = await User.find({
      [searchField]: searchRegex,
      _id: { $ne: req.user.id } // Exclude current user
    }).select('username email _id').limit(20);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/users/settings
// @desc    Get user settings including primary schedule
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('primarySchedule', 'name _id')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all schedules owned by this user
    const userSchedules = await Schedule.find({ user: req.user.id }).select('name _id');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        primarySchedule: user.primarySchedule
      },
      availableSchedules: userSchedules
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT api/users/settings/primary-schedule
// @desc    Update user's primary schedule
// @access  Private
router.put('/settings/primary-schedule', auth, async (req, res) => {
  const { scheduleId } = req.body;

  try {
    // Verify the schedule exists and belongs to the user
    if (scheduleId) {
      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      if (schedule.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to use this schedule' });
      }
    }

    // Update user's primary schedule
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { primarySchedule: scheduleId || null },
      { new: true }
    ).populate('primarySchedule', 'name _id').select('-password');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        primarySchedule: user.primarySchedule
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;